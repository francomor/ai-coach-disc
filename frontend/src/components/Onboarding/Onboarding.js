import React, { useState, useEffect } from "react";
import { fetchQuestions } from "../../helpers";
import NavBar from "../NavBar/NavBar";
import "./Onboarding.css";

const Onboarding = ({ onComplete, accessToken, user, token, groups }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [file, setFile] = useState(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fetchedQuestions = await fetchQuestions(accessToken);
        setQuestions(fetchedQuestions);
        setAnswers(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q.id]: "" }), {}));
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    };
    loadQuestions();
  }, [accessToken]);

  const handleChange = (questionId, event) => {
    setAnswers({ ...answers, [questionId]: event.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      question_id: parseInt(questionId, 10),
      answer,
    }));
    onComplete(formattedAnswers, file);
  };

  return (
    <>
      <NavBar
        user={user}
        removeToken={token.removeToken}
        groupName=""
        isChatSelectionNavigationDisabled={true}
        accessToken={token.token}
        usebigLogo={false}
        groups={groups}
      />
      <div className="onboarding-container">
        <h2>Onboarding</h2>
        <form className="onboarding-form" onSubmit={(e) => e.preventDefault()}>
          {questions.map((q) => (
            <div key={q.id} className="onboarding-input-group">
              <label htmlFor={`question-${q.id}`} className="onboarding-label">
                {q.text}
              </label>
              <input
                type="text"
                id={`question-${q.id}`}
                className="onboarding-input"
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e)}
              />
            </div>
          ))}
          <div className="file-input-group">
            <label className="onboarding-label" htmlFor="disc-profile">
              Upload DISC Profile (PDF)
            </label>
            <input
              type="file"
              id="disc-profile"
              accept="application/pdf"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>
          <button type="button" onClick={handleSubmit} className="onboarding-submit-button">
            Submit
          </button>
        </form>
      </div>
    </>
  );
};

export default Onboarding;
