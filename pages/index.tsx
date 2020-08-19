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

const WIDTH = 420;
const HEIGHT = 420;
const inputSize = 320;

interface Props {}

interface State {
  fullDesc: WithFaceDescriptor<
    WithFaceLandmarks<{ detection: FaceDetection }, FaceLandmarks68>
  > | null;

  matches: FaceMatch[] | null;
  facingMode: "user" | { exact: "environment" };
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
    };
  }

  componentDidMount = async () => {
    await loadModels();
    this.faceMatcher = await createMatcher(JSON_PROFILE);
    this.setInputDevice();
  };

  setInputDevice = () => {
    navigator.mediaDevices.enumerateDevices().then(async (devices) => {
      let inputDevice = devices.filter(
        (device) => device.kind === "videoinput"
      );
      if (inputDevice.length < 2) {
        this.setState({
          facingMode: "user",
        });
      } else {
        this.setState({
          facingMode: { exact: "environment" },
        });
      }
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
                    const cymaticFreq = cymaticFrequency();
                    const newMatch = new LabeledFaceDescriptors(cymaticFreq, [
                      this.descriptors[i],
                    ]);
                    this.faceMatcher.labeledDescriptors.push(newMatch);
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

  render() {
    const { matches, facingMode } = this.state;
    const label = matches?.[0]?.label;
    const frequency = (label as unknown) as number;

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
          {label || null}
        </h3>
        <PlayTone frequency={isNaN(frequency) ? undefined : frequency} />
      </div>
    );
  }
}

export default VideoInput;
