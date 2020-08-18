import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import {
  loadModels,
  getFullFaceDescription,
  createMatcher,
} from "../components/api/face";

import JSON_PROFILE from "./descriptors/bnk48.json";
import { LabeledFaceDescriptors } from "face-api.js";
const WIDTH = 420;
const HEIGHT = 420;
const inputSize = 160;

export default function Home() {
  const videoElRef = useRef<Webcam & HTMLVideoElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const [intervalFn, setIntervalFn] = useState(null);
  const [descriptors, setDescriptors] = useState<Float32Array[] | null>(null);
  const [detections, setDetections] = useState(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [match, setMatch] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  function setInputDevice() {
    navigator.mediaDevices.getUserMedia({ video: {} }).then(() => {
      startCapture();
    });
  }

  function startCapture() {
    setIntervalFn(
      setInterval(() => {
        capture();
      }, 500)
    );
  }

  const capture = async () => {
    if (!!videoElRef.current) {
      const currentScreenshot = videoElRef.current.getScreenshot();
      currentScreenshot &&
        (await getFullFaceDescription(currentScreenshot, inputSize).then(
          (fullDesc) => {
            if (!!fullDesc) {
              setDescriptors(fullDesc.map((fd) => fd.descriptor));
              setDetections(fullDesc.map((fd) => fd.detection));
            }
          }
        ));

      if (!!descriptors && !!faceMatcher) {
        let match = descriptors.map((descriptor) =>
          faceMatcher.findBestMatch(descriptor)
        );
        setMatch(match);
      }
    }
  };

  const initialize = async () => {
    await loadModels();
    setFaceMatcher(await createMatcher(JSON_PROFILE));
    setInputDevice();
  };

  useEffect(() => {
    initialize();

    return () => {
      clearInterval(intervalFn);
    };
  }, [match, detections, descriptors, labeledDescriptors]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Detect my face</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ position: "relative" }}>
        <Webcam
          ref={videoElRef}
          audio={false}
          width={WIDTH}
          height={HEIGHT}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: WIDTH,
            height: HEIGHT,
            facingMode: facingMode,
          }}
        />
        <canvas ref={canvasElRef} />
        <h3>match: {match}</h3>
        <h3>
          descriptor:{" "}
          <span
            style={{
              width: "12rem",
              textOverflow: "ellipsis",
              overflow: "hidden",
              display: "inline-block",
              whiteSpace: "nowrap",
              verticalAlign: "bottom",
            }}
          >
            {descriptors || "nothing yet"}
          </span>
        </h3>
      </div>
    </div>
  );
}
