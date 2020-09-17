import React, { ReactElement, useEffect, useState } from "react";
import { Synth, start, Volume } from "tone";
import { Tone } from "tone/build/esm/core/Tone";

interface Props {
  frequency?: number;
  volume?: number;
}

export default function PlayTone({ frequency, volume }: Props): ReactElement {
  const [currentFrequency, setCurrentFrequency] = useState<number | undefined>(
    undefined
  );
  const [synth, setSynth] = useState<Synth>(null);

  useEffect(() => {
    const vol = new Volume(volume);
    const synth = new Synth({
      envelope: {
        attack: 0.3,
        attackCurve: "linear",
        decay: 0,
        decayCurve: "linear",
        release: 0,
        releaseCurve: "linear",
        sustain: 0.3,
      },
    })
      .connect(vol)
      .toDestination();

    setSynth(synth);
    frequency && synth.triggerAttack(frequency);
    setCurrentFrequency(frequency);

    return () => {
      synth.triggerRelease();
    };
  }, []);

  if (synth && frequency !== currentFrequency) {
    synth.triggerRelease();
    frequency && synth.triggerAttack(frequency);
    setCurrentFrequency(frequency);
  }

  return (
    <button
      onClick={() => {
        start();
      }}
    >
      Start sound
    </button>
  );
}
