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
const inputSize = 160;

interface Props {}

interface State {
  detections: FaceDetection | null;
  fullDesc: WithFaceDescriptor<
    WithFaceLandmarks<{ detection: FaceDetection }, FaceLandmarks68>
  > | null;

  descriptors: Float32Array[] | null;
  faceMatcher: FaceMatcher | null;
  matches: FaceMatch[] | null;
  facingMode: "user" | { exact: "environment" };
}

class VideoInput extends Component<Props, State> {
  webcam: React.RefObject<Webcam & HTMLVideoElement>;
  interval: NodeJS.Timeout;
  constructor(props) {
    super(props);
    this.webcam = React.createRef();
    this.state = {
      fullDesc: null,
      detections: null,
      descriptors: null,
      faceMatcher: null,
      matches: null,
      facingMode: null,
    };
  }

  componentDidMount = async () => {
    await loadModels();
    this.setState({ faceMatcher: await createMatcher(JSON_PROFILE) });
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
              this.setState({
                detections: fullDesc.detection,
                descriptors: [fullDesc.descriptor],
              });
            }
          }
        ));

      if (!!this.state.descriptors && !!this.state.faceMatcher) {
        let matches = this.state.descriptors.map((descriptor) =>
          this.state.faceMatcher.findBestMatch(descriptor)
        );

        matches?.map((match, i) => {
          if (match.label === "unknown" && this.state.descriptors?.[i]) {
            console.log(
              "unknown face registering, known faces: " +
                this.state.faceMatcher.labeledDescriptors.length
            );
            const cymaticFreq = cymaticFrequency();
            const newMatch = new LabeledFaceDescriptors(cymaticFreq, [
              this.state.descriptors[i],
            ]);
            this.state.faceMatcher.labeledDescriptors.push(newMatch);
          }
        });

        this.setState({ matches });
      }
    }
  };

  debounce = (func: VoidFunction, wait: number, immediate?: boolean) => {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  render() {
    const { matches: match, facingMode, descriptors, faceMatcher } = this.state;
    const frequency = (match?.[0]?.label as unknown) as number;

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
          {match?.[0]?.label}
        </h3>
        <PlayTone frequency={isNaN(frequency) ? undefined : frequency} />
      </div>
    );
  }
}

export default VideoInput;
