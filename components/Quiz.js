// 質問に1問ずつ答える
import { useState } from 'react';

export default function Quiz({ questions, onDone, onBack }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = questions[step];

  function choose(v) {
    const next = { ...answers, [q.key]: v };
    setAnswers(next);
    if (step + 1 < questions.length) setStep(step + 1);
    else onDone(next);
  }

  return (
    <div>
      <div className="progress" aria-label={`${questions.length}問中${step + 1}問目`}>
        {questions.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}
      </div>
      <p className="q">{q.text}</p>
      <div className={`opts ${q.options.length <= 3 ? 'one' : ''}`}>
        {q.options.map((o) => {
          const v = typeof o === 'string' ? o : o.key;
          return (
            <button key={v} className={`chrome opt ${v === 'おまかせ' ? 'any' : ''}`} onClick={() => choose(v)}>
              {v}{o.desc && <small>{o.desc}</small>}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <button className="chrome" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => (step ? setStep(step - 1) : onBack())}>
          {step ? '前の質問に戻る' : 'トップに戻る'}
        </button>
      </div>
    </div>
  );
}
