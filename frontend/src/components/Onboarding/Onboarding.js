import React, { useState, useEffect } from "react";
import { fetchQuestions } from "../../helpers";
import NavBar from "../NavBar/NavBar";
import "./Onboarding.css";

const Onboarding = ({ onComplete, accessToken, user, token, groups }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

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

  useEffect(() => {
    if (questions.length > 0) {
      const allAnswered = questions.every((q) => answers[q.id]?.trim() !== "");
      setIsSubmitDisabled(!allAnswered);
    }
  }, [answers, questions]);

  const handleChange = (questionId, event) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: event.target.value,
    }));
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      question_id: parseInt(questionId, 10),
      answer,
    }));
    onComplete(formattedAnswers);
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
          <button type="button" onClick={handleSubmit} className="onboarding-submit-button" disabled={isSubmitDisabled}>
            Submit
          </button>
        </form>
      </div>
    </>
  );
};

export default Onboarding;
