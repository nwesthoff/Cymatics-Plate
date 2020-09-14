import React, { Component } from "react";
import Webcam from "react-webcam";
import {
  loadModels,
  getFullFaceDescription,
  createMatcher,
} from "../components/api/face";

// Import face profile
import JSON_PROFILE from "./descriptors/bnk48.json";
import {
  FaceDetection,
  LabeledFaceDescriptors,
  WithFaceDescriptor,
  WithFaceLandmarks,
  FaceLandmarks68,
  FaceMatcher,
  FaceMatch,
} from "face-api.js";
import { cymaticFrequency } from "../components/api/cymaticFrequency";
import PlayTone from "../components/PlayTone/PlayTone";
import { v4 as uuidv4 } from "uuid";
import RegisteredFaceDisplay from "../components/RegisteredFaceDisplay";

const WIDTH = 420;
const HEIGHT = 420;
const inputSize = 320;
const convertedFrequency = 1140;

interface Props {}

export interface RegisteredFace {
  frequency: number;
  id: string;
  match: LabeledFaceDescriptors | null;
  screenshot: string;
  converted: boolean;
}

interface State {
  fullDesc: WithFaceDescriptor<
    WithFaceLandmarks<{ detection: FaceDetection }, FaceLandmarks68>
  > | null;

  matches: FaceMatch[] | null;
  facingMode: "user" | { exact: "environment" };
  registeredFaces: RegisteredFace[] | null;
}

class VideoInput extends Component<Props, State> {
  webcam: React.RefObject<Webcam & HTMLVideoElement>;
  interval: NodeJS.Timeout;
  faceMatcher: FaceMatcher | null;
  detections: FaceDetection | null;
  descriptors: Float32Array[] | null;

  constructor(props) {
    super(props);
    this.webcam = React.createRef();
    this.faceMatcher = null;
    this.descriptors = null;
    this.detections = null;

    this.state = {
      fullDesc: null,
      matches: null,
      facingMode: null,
      registeredFaces: null,
    };
  }

  componentDidMount = async () => {
    console.time("loading models");
    await loadModels();
    console.timeEnd("loading models");
    console.time("creating facematcher");
    this.faceMatcher = await createMatcher(JSON_PROFILE);
    console.timeEnd("creating facematcher");
    console.time("setting inputdevice");
    this.setInputDevice();
    console.timeEnd("setting inputdevice");
  };

  setInputDevice = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(async (devices) => {
        this.setState({
          facingMode: "user",
        });
        this.startCapture();
      });
  };

  startCapture = () => {
    this.interval = setInterval(() => {
      this.capture();
    }, 500);
  };

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  capture = async () => {
    if (!!this.webcam.current) {
      const currentScreenshot = this.webcam.current.getScreenshot();
      currentScreenshot &&
        (await getFullFaceDescription(currentScreenshot, inputSize).then(
          (fullDesc) => {
            if (!!fullDesc) {
              this.descriptors = [fullDesc.descriptor];
              this.detections = fullDesc.detection;

              if (!!this.descriptors && !!this.faceMatcher) {
                let matches = this.descriptors.map((descriptor) =>
                  this.faceMatcher.findBestMatch(descriptor)
                );

                matches?.map((match, i) => {
                  if (match.label === "unknown" && this.descriptors?.[i]) {
                    console.log(
                      "unknown face registering, known faces: " +
                        this.faceMatcher.labeledDescriptors.length
                    );

                    const uuid = uuidv4();
                    console.time("registered face");
                    const newMatch = new LabeledFaceDescriptors(uuid, [
                      this.descriptors[i],
                    ]);

                    this.faceMatcher.labeledDescriptors.push(newMatch);
                    const newRegisteredFace = {
                      frequency: cymaticFrequency(),
                      match: newMatch,
                      id: uuid,
                      screenshot: currentScreenshot,
                      converted: false,
                    };

                    this.setState({
                      registeredFaces:
                        this.state.registeredFaces?.length > 0
                          ? this.state.registeredFaces.concat(newRegisteredFace)
                          : [newRegisteredFace],
                    });
                    console.timeEnd("registered face");
                  }
                });

                this.setState({ matches });
              }
            } else {
              this.setState({ matches: null });
            }
          }
        ));
    }
  };

  convertFaceHandler = (face: RegisteredFace) => {
    const registeredFaces = [...this.state.registeredFaces];
    registeredFaces.map((registeredFace) => {
      if (registeredFace.id === face.id) {
        registeredFace.converted = !registeredFace.converted;
      }
    });
    this.setState({ registeredFaces });
    console.log(`face ${face.id} converted`);
  };

  deleteFaceHandler = (face: RegisteredFace) => {
    const registeredFaces = this.state.registeredFaces.filter(
      (registeredFace) => {
        if (registeredFace.id !== face.id) {
          return registeredFace;
        }
      }
    );

    this.setState({ registeredFaces });
    console.log(`face ${face.id} deleted`);
  };

  render() {
    const { matches, facingMode } = this.state;
    const matchId = matches?.[0]?.label;
    const registeredFace = this.state.registeredFaces?.find(
      (face) => face.id === matchId
    );

    let videoConstraints = null;
    if (!!facingMode) {
      videoConstraints = {
        width: WIDTH,
        height: HEIGHT,
        facingMode: facingMode,
      };
    }

    return (
      <div
        className="Camera"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
          }}
        >
          {!!videoConstraints ? (
            <div style={{ position: "absolute" }}>
              <Webcam
                audio={false}
                width={WIDTH}
                height={HEIGHT}
                ref={this.webcam}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
              />
            </div>
          ) : null}
        </div>
        <h3>
          match:
          <br />
          {registeredFace?.converted
            ? convertedFrequency
            : registeredFace
            ? registeredFace.frequency
            : null}
        </h3>
        <PlayTone
          frequency={
            registeredFace?.converted
              ? convertedFrequency
              : registeredFace
              ? registeredFace.frequency
              : null
          }
        />
        <div
          style={{
            width: "980px",
            maxWidth: "90%",
            display: "flex",
            flexWrap: "wrap",
            padding: "1.2rem",
          }}
        >
          {this.state.registeredFaces?.length > 0 &&
            this.state.registeredFaces.map((face) => (
              <RegisteredFaceDisplay
                currentMatch={registeredFace?.id}
                clickHandler={this.convertFaceHandler}
                deleteHandler={this.deleteFaceHandler}
                face={face}
              />
            ))}
        </div>
      </div>
    );
  }
}

export default VideoInput;
