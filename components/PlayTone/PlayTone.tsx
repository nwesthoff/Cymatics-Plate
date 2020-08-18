import React, { ReactElement, useEffect } from "react";
import { Synth } from "tone";

interface Props {
  frequency?: number;
}

export default function PlayTone({ frequency }: Props): ReactElement {
  useEffect(() => {
    const synth = new Synth({
      volume: 0.3,
      envelope: {
        attack: 0.3,
        attackCurve: "linear",
        decay: 0,
        decayCurve: "linear",
        release: 0,
        releaseCurve: "linear",
        sustain: 0.3,
      },
    }).toDestination();
    frequency && synth.triggerAttack(frequency);

    return () => {
      return synth.triggerRelease();
    };
  });

  return <div>haha</div>;
}
