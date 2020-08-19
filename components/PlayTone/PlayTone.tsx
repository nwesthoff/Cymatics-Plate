import React, { ReactElement, useEffect, useState } from "react";
import { Synth } from "tone";

interface Props {
  frequency?: number;
}

export default function PlayTone({ frequency }: Props): ReactElement {
  const [currentFrequency, setCurrentFrequency] = useState<number | undefined>(
    undefined
  );
  const [synth, setSynth] = useState(null);

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

    setSynth(synth);
    frequency && synth.triggerAttack(frequency);
    setCurrentFrequency(frequency);
  }, []);

  if (synth && frequency !== currentFrequency) {
    synth.triggerRelease();
    frequency && synth.triggerAttack(frequency);
    setCurrentFrequency(frequency);
  }

  return null;
}
