import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/notify";

const InterviewPage = () => {
  const [form, setForm] = useState({ jobTitle: "", field: "IT", level: "junior" });
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);
  const [history, setHistory] = useState([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(true);
  const [voiceVoice, setVoiceVoice] = useState("alloy");
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const silenceMonitorRef = useRef(null);
  const activeQuestion = session?.questions?.[session.currentQuestionIndex];

  const progress = useMemo(() => {
    if (!session?.questions?.length) return 0;
    return Math.round((session.currentQuestionIndex / session.questions.length) * 100);
  }, [session]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/interviews/history");
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load interview history");
    }
  };

  const loadSession = async (sessionId) => {
    if (!sessionId) return;
    setLoadingResume(true);
    try {
      stopRecording();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      const { data } = await api.get(`/interviews/${sessionId}`);
      setSession(data);
      setAnswer(data.answers?.[data.currentQuestionIndex]?.answer || "");
      navigate("/app/interview", { replace: true, state: {} });
    } catch (err) {
      setError(err.response?.data?.message || "Could not resume the interview");
    } finally {
      setLoadingResume(false);
    }
  };

  const start = async (event) => {
    event.preventDefault();
    setError("");
    try {
      stopRecording();
      const { data } = await api.post("/interviews/start", form);
      setSession(data);
      setAnswer("");
      notify("Interview session created", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Could not start simulation");
      notify(err.response?.data?.message || "Could not start simulation", "error");
    }
  };

  useEffect(() => {
    loadHistory();

    const resumeSessionId = location.state?.resumeSessionId || new URLSearchParams(window.location.search).get("sessionId");
    if (resumeSessionId) {
      loadSession(resumeSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!voiceMode || session?.status !== "in_progress" || !activeQuestion) return;
    playQuestionAudio(activeQuestion, { autoStartRecording: handsFreeMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, handsFreeMode, session?.currentQuestionIndex, session?.status, activeQuestion]);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      stopRecording();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAnswer = async (nextAnswer = answer) => {
    if (!session) return;
    stopRecording();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/interviews/${session._id}/answer`, { answer: nextAnswer });
      setSession(data);
      setAnswer("");
      notify("Answer saved", "success");
    } finally {
      setSubmitting(false);
    }
  };

  const complete = async () => {
    stopRecording();
    setFinishing(true);
    try {
      const { data } = await api.post(`/interviews/${session._id}/complete`);
      setSession(data);
      notify("Final report generated", "success");
    } finally {
      setFinishing(false);
    }
  };

  const downloadReport = async () => {
    if (!session?._id) return;
    try {
      const response = await api.get(`/reports/${session._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${session._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      notify("PDF report downloaded", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Unable to download the report", "error");
    }
  };

  const playQuestionAudio = async (text = activeQuestion, options = {}) => {
    if (!text) return;
    setVoiceError("");
    setSpeaking(true);
    try {
      const { data } = await api.post(
        "/voice/speak",
        {
          text,
          voice: voiceVoice,
          instructions:
            "You are a realistic, professional interview panelist. Speak clearly, naturally, and with a calm corporate tone.",
        },
        { responseType: "blob" }
      );

      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }

      const url = window.URL.createObjectURL(new Blob([data], { type: "audio/mpeg" }));
      const audio = new Audio(url);
      activeAudioRef.current = audio;
      audio.onended = () => {
        window.URL.revokeObjectURL(url);
        activeAudioRef.current = null;
        if (options.autoStartRecording) {
          startRecording();
        }
      };
      audio.onerror = () => {
        window.URL.revokeObjectURL(url);
        activeAudioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      let message = "Could not play the interview question";
      if (err.response?.data instanceof Blob && err.response.data.type === "application/json") {
        try {
          const text = await err.response.data.text();
          const errorJson = JSON.parse(text);
          message = errorJson.message || message;
        } catch (parseErr) {
          console.error("Error parsing blob error response:", parseErr);
        }
      } else {
        message = err.response?.data?.message || err.message || message;
      }
      setVoiceError(message);
      notify(message, "error");
    } finally {
      setSpeaking(false);
    }
  };

  const dataUrlToBase64 = (value) => {
    const [, base64 = ""] = String(value).split(",");
    return base64;
  };

  const transcribeBlob = async (blob) => {
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read audio recording"));
      reader.readAsDataURL(blob);
    });

    const { data } = await api.post("/voice/transcribe", {
      audioBase64: dataUrlToBase64(dataUrl),
    });

    return data?.text || "";
  };

  const stopRecording = () => {
    if (silenceMonitorRef.current) {
      window.clearInterval(silenceMonitorRef.current);
      silenceMonitorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Your browser does not support microphone recording.");
      notify("Your browser does not support microphone recording.", "error");
      return;
    }

    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const buffer = new Uint8Array(analyser.fftSize);
      let silenceSince = null;

      silenceMonitorRef.current = window.setInterval(() => {
        if (recorder.state !== "recording") return;
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const value = (buffer[index] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / buffer.length);
        if (rms < 0.02) {
          if (!silenceSince) {
            silenceSince = Date.now();
          }
          if (Date.now() - silenceSince > 1300) {
            stopRecording();
          }
        } else {
          silenceSince = null;
        }
      }, 180);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (silenceMonitorRef.current) {
          window.clearInterval(silenceMonitorRef.current);
          silenceMonitorRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        setRecording(false);
        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const transcript = await transcribeBlob(blob);
          if (transcript) {
            setAnswer(transcript);
            if (handsFreeMode) {
              await submitAnswer(transcript);
              return;
            }
            notify("Voice answer transcribed", "success");
          } else {
            notify("No speech detected in the recording", "error");
          }
        } catch (err) {
          setVoiceError(err.response?.data?.message || err.message || "Could not transcribe the recording");
          notify(err.response?.data?.message || "Could not transcribe the recording", "error");
        }
      };

      recorder.start();
      setRecording(true);
      notify("Recording started", "success");
    } catch (err) {
      setVoiceError(err.response?.data?.message || "Could not access the microphone");
      notify(err.response?.data?.message || "Could not access the microphone", "error");
    }
  };

  const questionThemes = session?.questionThemes || [];
  const answeredAnalyses = session?.answers?.filter((item) => item.analysis?.overall) || [];
  const lastDraft = history.find((item) => item.status === "in_progress") || history[0];

  return (
    <div className="grid gap-lg">
      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Interview Builder</p>
            <h3>Start a role-specific simulation</h3>
          </div>
          {session?.roleSummary && <span className="pill muted-pill">{session.roleSummary}</span>}
        </div>
        <form className="inline-form" onSubmit={start}>
          <input
            placeholder="Job title"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            required
          />
          <select value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })}>
            <option>IT</option>
            <option>marketing</option>
            <option>finance</option>
            <option>cybersecurity</option>
            <option>design</option>
          </select>
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            <option>internship</option>
            <option>junior</option>
            <option>senior</option>
          </select>
          <button className="btn-primary" type="submit">Generate Questions</button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </section>

      {!session && history.length > 0 && (
        <section className="card hero-strip">
          <div>
            <p className="eyebrow">Continue where you left off</p>
            <h3>{lastDraft?.jobTitle}</h3>
            <p className="muted">
              {lastDraft?.field} | {lastDraft?.level} | {lastDraft?.status}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => loadSession(lastDraft?._id)}
            disabled={!lastDraft?._id || loadingResume}
          >
            {loadingResume ? "Loading..." : "Resume session"}
          </button>
        </section>
      )}

      {session && session.status === "in_progress" && (
        <section className="card interview-grid">
          <div>
            <div className="section-head">
              <div>
                <p className="eyebrow">In Session</p>
                <h3>{session.jobTitle}</h3>
              </div>
              <div className="chip-group">
                <span className="pill">{session.field}</span>
                <span className="pill">{session.level}</span>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="muted">{progress}% complete</p>

            {questionThemes.length > 0 && (
              <div className="chip-group">
                {questionThemes.map((theme) => (
                  <span key={theme} className="chip">
                    {theme}
                  </span>
                ))}
              </div>
            )}

            {session.roleSummary && <p className="muted">{session.roleSummary}</p>}

            <div className="question-card">
              <p className="eyebrow">Current question</p>
              <p className="question-copy">{activeQuestion}</p>
            </div>

            <div className="voice-panel">
              <div className="voice-panel-head">
                <div>
                  <p className="eyebrow">Voice mode</p>
                  <h4>Interview like the real thing</h4>
                </div>
                <label className="switch-row">
                  <input type="checkbox" checked={voiceMode} onChange={(e) => setVoiceMode(e.target.checked)} />
                  <span>Enable voice</span>
                </label>
              </div>

              <label className="switch-row">
                <input
                  type="checkbox"
                  checked={handsFreeMode}
                  onChange={(e) => setHandsFreeMode(e.target.checked)}
                  disabled={!voiceMode}
                />
                <span>Hands-free mode</span>
              </label>

              <div className="row-actions wrap">
                <select value={voiceVoice} onChange={(e) => setVoiceVoice(e.target.value)}>
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="nova">Nova</option>
                  <option value="onyx">Onyx</option>
                </select>
                <button type="button" className="btn-secondary" onClick={() => playQuestionAudio()}>
                  {speaking ? "Speaking..." : "Play question"}
                </button>
                {recording ? (
                  <button type="button" className="btn-primary" onClick={stopRecording}>
                    Stop recording
                  </button>
                ) : (
                  <button type="button" className="btn-primary" onClick={startRecording}>
                    Record answer
                  </button>
                )}
              </div>
              <p className="muted small-copy">
                OpenAI audio is used for the spoken question and transcription. Hands-free mode starts recording after the
                question, then stops automatically on silence.
              </p>
              {voiceError && <p className="error-text">{voiceError}</p>}
            </div>

            <textarea
              rows={6}
              placeholder="Write your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="row-actions">
              <button type="button" className="btn-primary" onClick={submitAnswer} disabled={submitting}>
                {submitting ? "Saving..." : "Save & Next"}
              </button>
              <button type="button" className="btn-secondary" onClick={complete} disabled={finishing}>
                {finishing ? "Generating..." : "Finish & Generate Report"}
              </button>
            </div>
          </div>

          <aside className="stack">
            {session.practicalExercise && (
              <div className="highlight-card">
                <p className="eyebrow">Practical Exercise</p>
                <h4>{session.practicalExercise.title}</h4>
                <p>{session.practicalExercise.prompt}</p>
                <p className="muted">{session.practicalExercise.expectedOutcome}</p>
              </div>
            )}

            {answeredAnalyses.length > 0 && (
              <div className="card-inner">
                <h4>Answer feedback</h4>
                {answeredAnalyses.map((item, index) => (
                  <article className="answer-card" key={`${item.summary}-${index}`}>
                    <div className="answer-score-row">
                      <strong>Q{index + 1}</strong>
                      <span className="pill">{item.analysis.overall}/100</span>
                    </div>
                    <p className="muted">{item.analysis.summary}</p>
                    <div className="score-mini-grid">
                      <span>Clarity {item.analysis.clarity}</span>
                      <span>Relevance {item.analysis.relevance}</span>
                      <span>Confidence {item.analysis.confidence}</span>
                    </div>
                    {item.analysis.tips?.[0] && <p className="muted">{item.analysis.tips[0]}</p>}
                  </article>
                ))}
              </div>
            )}
          </aside>
        </section>
      )}

      {!session && (
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Recent sessions</p>
              <h3>Quick resume</h3>
            </div>
          </div>
          {history.length === 0 && <p className="muted">No interview session yet.</p>}
          {history.slice(0, 4).map((item) => (
            <div key={item._id} className="item-row">
              <div className="answer-score-row">
                <strong>{item.jobTitle}</strong>
                {item.finalReport?.overall != null && <span className="pill">{item.finalReport.overall}/100</span>}
              </div>
              <p className="muted">
                {item.field} | {item.level} | {item.status}
              </p>
              <div className="row-actions">
                <button className="btn-secondary" onClick={() => loadSession(item._id)}>
                  Open
                </button>
                {item.status === "in_progress" && (
                  <button className="btn-primary" onClick={() => loadSession(item._id)}>
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {session?.status === "completed" && session.finalReport && (
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Final Report</p>
              <h3>Assessment summary</h3>
            </div>
            <div className="row-actions">
              <span className="pill primary-pill">{session.finalReport.overall ?? 0}/100 overall</span>
              {user?.plan === "premium" ? (
                <button className="btn-secondary" onClick={downloadReport}>
                  Download PDF
                </button>
              ) : (
                <button className="btn-secondary" disabled title="Premium only">
                  PDF Premium
                </button>
              )}
            </div>
          </div>
          <p className="muted">{session.finalReport.summary}</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${session.finalReport.overall ?? 0}%` }} />
          </div>
          <div className="stats-grid">
            <article className="mini-card"><p>Communication</p><h4>{session.finalReport.communication}</h4></article>
            <article className="mini-card"><p>Clarity</p><h4>{session.finalReport.clarity}</h4></article>
            <article className="mini-card"><p>Relevance</p><h4>{session.finalReport.relevance}</h4></article>
            <article className="mini-card"><p>Confidence</p><h4>{session.finalReport.confidence}</h4></article>
          </div>
          <div className="report-grid">
            <div className="card-inner">
              <h4>Strengths</h4>
              <ul className="compact-list">
                {session.finalReport.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card-inner">
              <h4>Needs work</h4>
              <ul className="compact-list">
                {session.finalReport.improvementsNeeded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card-inner">
              <h4>Coaching tips</h4>
              <ul className="compact-list">
                {session.finalReport.tips.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default InterviewPage;
