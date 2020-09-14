import React, { ReactElement } from "react";
import { RegisteredFace } from "../pages";
import {
  FaCheckCircle,
  FaStopCircle,
  FaTimesCircle,
  FaTrash,
  FaWaveSquare,
} from "react-icons/fa";

interface Props {
  face: RegisteredFace;
  clickHandler: (face: RegisteredFace) => void;
  deleteHandler: (face: RegisteredFace) => void;
  currentMatch?: string;
}

export default function RegisteredFaceDisplay({
  face,
  clickHandler,
  deleteHandler,
  currentMatch,
}: Props): ReactElement {
  return (
    <article
      style={{
        border: face.id === currentMatch ? "5px solid green" : "",
        position: "relative",
        minWidth: 200,
        maxWidth: 400,
        flexBasis: "calc(25% - 3*.4rem)",
        flexGrow: 1,
        margin: ".4rem",
      }}
    >
      <img
        onClick={() => clickHandler(face)}
        key={face.id}
        src={face.screenshot}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          background: "#444",
          borderRadius: "50px",
          padding: ".4rem",
          width: "2rem",
          height: "2rem",
          textAlign: "center",
          verticalAlign: "middle",
        }}
        onClick={() => deleteHandler(face)}
      >
        <FaTrash color="white" />
      </div>
      <div
        style={{
          width: "100%",
          position: "absolute",
          bottom: 0,
          left: 0,
          padding: ".4rem",
          margin: 0,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.8))",
        }}
      >
        <span>
          <FaWaveSquare /> {face.frequency}
        </span>
        <span onClick={() => clickHandler(face)}>
          {face.converted ? <FaCheckCircle /> : <FaTimesCircle />}
        </span>
      </div>
    </article>
  );
}
