import React, { useRef, useEffect, useState } from 'react';
import './Chatbot.css';
import logo from "./gpn.png";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I assist you today?', sender: 'bot', priorityIdentification: false, stage: "" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messageEndRef = useRef(null);
  // const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  // const handleFeedback = (index, feedbackType) => {
  //   setMessages((prevMessages) =>
  //     prevMessages.map((msg, i) =>
  //       i === index ? {
  //         ...msg,
  //         feedback: feedbackType,
  //         feedbackMessage:
  //           feedbackType === "up"
  //             ? "Thanks for the feedback. We are processing the issue."
  //             : "Thank you for the feedback. Please provide more details."
  //       } : msg
  //     )
  //   );
  // };

  const handleFeedback = async (index, feedbackType) => {
    setMessages((prevMessages) => {
      // const latestMessage = prevMessages[prevMessages.length - 1]; // Get the latest message
      // console.log("Latest Message Text:", latestMessage.text);
      // console.log("Issue:", latestMessage.text.issue);
      // console.log("Priority:", latestMessage.text.priority);

      return prevMessages.map((msg, i) =>
        i === index
          ? {
            ...msg,
            feedback: feedbackType,
            feedbackMessage:
              feedbackType === "up"
                ? "Thanks for the feedback. We are processing the issue. Please wait..."
                : "Thank you for the feedback. Please provide more details.",
            feedbackGiven: true, // Added this flag to track feedback
          }
          : msg
      );
    });

    // If the feedback is "up", send request to Jira creation API
    if (feedbackType === "up") {
      console.log('inside feedback up condition')
      const latestMessage = messages[messages.length - 1];
      // setMessages([...messages, { text: userInput, sender: 'user' }]);
      // setUserInput('');

      console.log(JSON.stringify(latestMessage, null, 2))
      console.log(JSON.stringify({
        priority: latestMessage.text.priority,
        summary: latestMessage.text.summary,
        description: latestMessage.text.description
      }));

      try {

        const jiraCreationResponse = await fetch("http://127.0.0.1:8080/jira_creation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priority: latestMessage.text.priority,
            summary: latestMessage.text.summary,
            description: latestMessage.text.description
          }),
        });
        const jiraCreationResponseData = await jiraCreationResponse.json();
        console.log('Response from http://127.0.0.1:8080/jira_creation end point url')
        console.log(JSON.stringify(jiraCreationResponseData, null, 2))


        const whiteBoardCreationResponse = await fetch("http://127.0.0.1:8080/white_board_creation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jira_id: jiraCreationResponseData.jira_id,
            summary: latestMessage.text.summary,
            segment: latestMessage.text.segment,
            product: latestMessage.text.product
          }),
        });
        const whiteBoardCreationResponseData = await whiteBoardCreationResponse.json();
        console.log('Response from http://127.0.0.1:8080/white_board_creation end point url')
        console.log(JSON.stringify(whiteBoardCreationResponseData, null, 2))

        const statusPageCreationResponse = await fetch("http://127.0.0.1:8080/status_page_creation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jira_id: jiraCreationResponseData.jira_id,
            description: latestMessage.text.description,
            priority: latestMessage.text.priority,
            summary: latestMessage.text.summary
          }),
        });
        const statusPageCreationResponseData = await statusPageCreationResponse.json();
        console.log('Response from http://127.0.0.1:8080/status_page_creation end point url')
        console.log(JSON.stringify(statusPageCreationResponseData, null, 2))

        const updatedMessage = {
          ...latestMessage,
          text: {
            ...latestMessage.text, // Keep existing properties
            jira_id: jiraCreationResponseData.jira_id,
            jira_link: jiraCreationResponseData.jira_link,
            white_board_id: whiteBoardCreationResponseData.white_board_id,
            white_board_link: whiteBoardCreationResponseData.white_board_link,
            status_io_id: statusPageCreationResponseData.status_io_id,
            status_io_page_link: statusPageCreationResponseData.status_io_page_link
          }
        };
        console.log("updatedMessage")
        console.log(JSON.stringify(updatedMessage, null, 2))

        setMessages((prevMessages) => [
          ...prevMessages,
          { text: updatedMessage.text, sender: 'bot', priorityIdentification: true, stage: 'incident_creation' }
        ]);
      } catch (error) {
        console.error("Error creating issue details:", error);
        alert("Failed to create issue details");
      }
    }
  };

  const handleSendMessage = async () => {
    if (userInput.trim()) {

      const latestMessage = messages[messages.length - 1];
      // console.log('latestMessage in handleSendMessage:- ' + latestMessage.text)

      setMessages([...messages, { text: userInput, sender: 'user' }]);
      setUserInput('');

      if (latestMessage?.feedback === "down") {
        console.log('inside feedback down condition')
        // console.log('latestMessage in handleSendMessage feedback:- ' + latestMessage.feedback)
        // console.log('latestMessage in handleSendMessage issue:- ' + latestMessage.text.issue)
        // console.log('latestMessage in handleSendMessage priority:- ' + latestMessage.text.priority)

        // console.log(JSON.stringify({
        //   user_feedback: userInput.trim(),
        //   context: latestMessage.text
        // }));

        try {

          const feedbackResponse = await fetch("http://127.0.0.1:8080/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_feedback: userInput.trim(),
              context: latestMessage.text
            }),
          });

          const data = await feedbackResponse.json();

          console.log('Response from http://127.0.0.1:8080/feedback end point url')
          // console.log(JSON.stringify({ issue: userInput.trim() }))
          console.log(JSON.stringify(data, null, 2))
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: data.context, sender: 'bot', priorityIdentification: true, stage: "feedback" }
          ]);
        } catch (error) {
          console.error("Error sending feedback:", error);
          alert("Failed to send feedback");
        }
        // }else if(latestMessage?.feedback === "up"){
        //     console.log('inside feedback up condition')
      } else {
        console.log('inside else condition')
        try {
          const response = await fetch('http://localhost:8080/priority_identification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issue: userInput.trim() })
          });
          const data = await response.json();
          console.log('Response from http://127.0.0.1:8080/priority_identification end point url')
          console.log(data)
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: data, sender: 'bot', priorityIdentification: true, stage: "priority_identification" }
          ]);
        } catch (error) {
          console.error('Error:', error);
          alert('Failed to retrieve response');
        }
      }
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className="chatbot-icon-container" onClick={toggleChatbot}>
        <div className="chatbot-icon"><span>🤖</span></div>
        {!isOpen && <span className="chatbot-text">I'm here to help</span>}
      </div>
      {isOpen && (
        <div className="chatbot-container open">
          <div className="chatbot-header" onClick={toggleChatbot}>
            <img src={logo} alt="Chatbot Logo" className="chatbot-logo" />
            <h3>GPN Chatbot</h3>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <span className="message-icon">{msg.sender === 'user' ? '👤' : '🤖'}</span>
                {/* <p id="rs" dangerouslySetInnerHTML={{ __html: msg.text }} /> */}
                {/* <p id="rs">{JSON.stringify(msg.text, null, 2)}</p> */}

                {!msg.priorityIdentification && <p id="rs" dangerouslySetInnerHTML={{ __html: msg.text }} />}

                {msg.priorityIdentification && (
                  <div className="priority-response">

                    {msg.stage !== "incident_creation" && (
                      <p id="rs">
                        <strong>Issue Summary:</strong> {msg.text.summary} <br /><br />
                        <strong>Issue Description:</strong> {msg.text.description} <br /><br />
                        <strong>Issue Priority:</strong> {msg.text.priority} <br /><br />
                        <strong>Issue Segment:</strong> {msg.text.segment} <br /><br />
                        <strong>Issue Product:</strong> {msg.text.product} <br /><br />
                        <strong>Issue Impact:</strong> {msg.text.impact} <br /><br />
                        <strong>Issue Urgency:</strong> {msg.text.urgency} <br /><br />
                      </p>
                    )}

                    {msg.text.jira_id && (
                      <p id="rs">
                        {/* <strong>JIRA ID:</strong> {msg.text.jira_id} <br /><br />
                      <strong>JIRA Link:</strong> <a href={msg.text.jira_link} target="_blank" rel="noopener noreferrer">{msg.text.jira_link}</a> <br /><br /> */}
                        <br /><strong>JIRA Link:</strong> <a href={msg.text.jira_link} target="_blank" rel="noopener noreferrer">{msg.text.jira_id}</a> <br /><br />
                      </p>
                    )}

                    {/* Conditionally Display Whiteboard Information */}
                    {msg.text.white_board_id && (
                      <p id="rs">
                        {/* <strong>Whiteboard ID:</strong> {msg.text.white_board_id} <br />
                      <strong>Whiteboard Link:</strong> <a href={msg.text.white_board_link} target="_blank" rel="noopener noreferrer">{msg.text.white_board_link}</a> <br /><br /> */}
                        <strong>White Board Information:</strong> <a href={msg.text.white_board_link} target="_blank" rel="noopener noreferrer">White Board</a> <br /><br />
                      </p>
                    )}

                    {/* Conditionally Display Status Page Information */}
                    {msg.text.status_io_id && (
                      <p id="rs">
                        {/* <strong>Status Page ID:</strong> {msg.text.status_io_id} <br />
                      <strong>Status Page Link:</strong> <a href={msg.text.status_io_page_link} target="_blank" rel="noopener noreferrer">{msg.text.status_io_page_link}</a> <br /><br /> */}
                        <strong>Status IO Page Information:</strong> <a href={msg.text.status_io_page_link} target="_blank" rel="noopener noreferrer">Status IO Page</a> <br /><br />
                      </p>
                    )}
                    {/* {msg.stage !== "incident_creation" && (
                      <div className="feedback-buttons">
                        <button
                          className={`thumb-button ${msg.feedback === 'up' ? 'selected' : ''}`}
                          onClick={() => handleFeedback(index, 'up')}
                        >
                          👍
                        </button>
                        <button
                          className={`thumb-button ${msg.feedback === 'down' ? 'selected' : ''}`}
                          onClick={() => handleFeedback(index, 'down')}
                        >
                          👎
                        </button>
                      </div>
                    )} */}
                    {/* {msg.stage !== "incident_creation" && (
                      <div className="feedback-buttons">
                        {!msg.feedbackGiven && (
                          <>
                            <button
                              className={`thumb-button ${msg.feedback === 'up' ? 'selected' : ''}`}
                              onClick={() => handleFeedback(index, 'up')}
                            >
                              👍
                            </button>
                            <button
                              className={`thumb-button ${msg.feedback === 'down' ? 'selected' : ''}`}
                              onClick={() => handleFeedback(index, 'down')}
                            >
                              👎
                            </button>
                          </>
                        )}

                        {msg.feedbackGiven && (
                          <button
                            className="thumb-button selected"
                            style={{ backgroundColor: "#ccc", cursor: "default" }} // Greyed-out button
                          >
                            {msg.feedback === "up" ? "👍" : "👎"}
                          </button>
                        )}
                      </div>
                    )} */}

                    {/* {msg.stage !== "incident_creation" && (
                      <div className="feedback-buttons">
                        {!msg.feedbackGiven ? (
                          <>
                            <button
                              className="thumb-button"
                              onClick={() => handleFeedback(index, 'up')}
                            >
                              👍
                            </button>
                            <button
                              className="thumb-button"
                              onClick={() => handleFeedback(index, 'down')}
                            >
                              👎
                            </button>
                          </>
                        ) : (
                          <button className="thumb-button">
                            <span className="grey-thumb">{msg.feedback === "up" ? "👍" : "👎"}</span>
                          </button>
                        )}
                      </div>
                    )} */}
                    {msg.stage !== "incident_creation" && (
                      <div className="feedback-buttons">
                        <button
                          className={`thumb-button ${msg.feedback === "up" ? "selected" : ""}`}
                          onClick={() => handleFeedback(index, "up")}
                          disabled={msg.feedbackGiven} // Disable if feedback is given
                        >
                          👍
                        </button>
                        <button
                          className={`thumb-button ${msg.feedback === "down" ? "selected" : ""}`}
                          onClick={() => handleFeedback(index, "down")}
                          disabled={msg.feedbackGiven} // Disable if feedback is given
                        >
                          👎
                        </button>
                      </div>
                    )}

                    {msg.feedbackMessage && (
                      <p
                        className={`feedback-message ${msg.feedback === "up" ? "feedback-green" : "feedback-orange"
                          }`}
                      >
                        {msg.feedbackMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}


            <div ref={messageEndRef}></div>
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
