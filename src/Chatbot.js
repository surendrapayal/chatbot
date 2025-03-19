import React, { useRef, useEffect, useState } from "react";
import "./Chatbot.css";
import logo from "./gpn.png";

const Chatbot = () => {

  const error_description = "This issue does not appear to be related to any GP products, and unfortunately, I am unable to proceed with further action. Thank you for your understanding."

  const [messages, setMessages] = useState([
    {
      text: "Hello! How can I assist you today?",
      sender: "bot",
      priorityIdentification: false,
      stage: "",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => setUserInput(e.target.value);

  const handleFeedback = async (index, feedbackType) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg, i) =>
        i === index
          ? {
            ...msg,
            feedback: feedbackType,
            feedbackMessage:
              msg.text.description === error_description
                ? "Thank you for the feedback. Unfortunately, this issue is not related to any GP products, and no further action can be taken."
                : feedbackType === "up"
                  ? "Thank you for the feedback. We are processing the issue. Please wait..."
                  : "Thank you for the feedback. Please provide more details.",
            feedbackGiven: true,
          }
          : msg
      )
    );

    const latestMessage = messages[messages.length - 1];

    if (latestMessage.text.description === error_description) {
      console.log("Skip the feedback logic as error description condition met")
      return;
    }

    if (feedbackType === "up") {
      try {
        // Step 1: Execute Jira Creation API
        const jiraCreationResponse = await fetch(
          "http://127.0.0.1:8080/jira_creation",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              priority: latestMessage.text.priority,
              summary: latestMessage.text.summary,
              description: latestMessage.text.description,
            }),
          }
        );
        const jiraData = await jiraCreationResponse.json();
        console.log('Response from http://127.0.0.1:8080/jira_creation end point url')
        console.log(JSON.stringify(jiraData, null, 2))


        // const whiteBoardResponse = await fetch(
        //   "http://127.0.0.1:8080/white_board_creation",
        //   {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //       jira_id: jiraData.jira_id,
        //       summary: latestMessage.text.summary,
        //       segment: latestMessage.text.segment,
        //       product: latestMessage.text.product,
        //     }),
        //   }
        // );
        // const whiteBoardData = await whiteBoardResponse.json();
        // console.log('Response from http://127.0.0.1:8080/white_board_creation end point url')
        // console.log(JSON.stringify(whiteBoardData, null, 2))

        // const statusPageResponse = await fetch(
        //   "http://127.0.0.1:8080/status_page_creation",
        //   {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //       jira_id: jiraData.jira_id,
        //       description: latestMessage.text.description,
        //       priority: latestMessage.text.priority,
        //       summary: latestMessage.text.summary,
        //     }),
        //   }
        // );
        // const statusPageData = await statusPageResponse.json();
        // console.log('Response from http://127.0.0.1:8080/status_page_creation end point url')
        // console.log(JSON.stringify(statusPageData, null, 2))

        // Step 2: Execute White Board Creation & Status Page Creation in Parallel
        const [whiteBoardData, statusPageData] = await Promise.all([
          fetch("http://127.0.0.1:8080/white_board_creation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jira_id: jiraData.jira_id,
              summary: latestMessage.text.summary,
              segment: latestMessage.text.segment,
              product: latestMessage.text.product,
            }),
          }).then((res) => res.json()),

          fetch("http://127.0.0.1:8080/status_page_creation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jira_id: jiraData.jira_id,
              description: latestMessage.text.description,
              priority: latestMessage.text.priority,
              summary: latestMessage.text.summary,
            }),
          }).then((res) => res.json()),
        ]);

        console.log("Response from white_board_creation API:");
        console.log(JSON.stringify(whiteBoardData, null, 2));

        console.log("Response from status_page_creation API:");
        console.log(JSON.stringify(statusPageData, null, 2));

        // const sendNotificationResponse = await fetch(
        //   "http://127.0.0.1:8080/send_notification",
        //   {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //       description: latestMessage.text.description,
        //       jira_id: jiraData.jira_id,
        //       jira_link: jiraData.jira_link,
        //       status_io_link: statusPageData.status_io_page_link,
        //       white_board_link: whiteBoardData.white_board_link,
        //       segment: latestMessage.text.segment,
        //       product: latestMessage.text.product,
        //       priority: latestMessage.text.priority,
        //       impact: latestMessage.text.impact
        //     }),
        //   }
        // );
        // const sendNotificationData = await sendNotificationResponse.json();
        // console.log('Response from http://127.0.0.1:8080/send_notification end point url')
        // console.log(JSON.stringify(sendNotificationData, null, 2))

        // Step 3: Update the UI with responses from Jira, White Board, and Status Page APIs
        const updatedMessage = {
          ...latestMessage,
          text: {
            ...latestMessage.text,
            jira_id: jiraData.jira_id,
            jira_link: jiraData.jira_link,
            white_board_id: whiteBoardData.white_board_id,
            white_board_link: whiteBoardData.white_board_link,
            status_io_id: statusPageData.status_io_id,
            status_io_page_link: statusPageData.status_io_page_link,
          },
        };

        console.log('updatedMessage:-\n' + updatedMessage)

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: updatedMessage.text,
            sender: "bot",
            priorityIdentification: true,
            stage: "incident_creation",
          },
        ]);

        // Step 4: Run send_notification in the background (without awaiting its response)
        fetch("http://127.0.0.1:8080/send_notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: latestMessage.text.description,
            jira_id: jiraData.jira_id,
            jira_link: jiraData.jira_link,
            status_io_link: statusPageData.status_io_page_link,
            white_board_link: whiteBoardData.white_board_link,
            segment: latestMessage.text.segment,
            product: latestMessage.text.product,
            priority: latestMessage.text.priority,
            impact: latestMessage.text.impact,
          }),
        })
          .then((res) => res.json())
          .then((sendNotificationData) => {
            console.log("Response from send_notification API (background):");
            console.log(JSON.stringify(sendNotificationData, null, 2));
          })
          .catch((error) => {
            console.error("Error sending notification:", error);
          });

      } catch (error) {
        console.error("Error creating issue details:", error);
        alert("Failed to create issue details");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const latestMessage = messages[messages.length - 1];
    setMessages([...messages, { text: userInput, sender: "user" }]);
    setUserInput("");

    if (latestMessage?.feedback === "down") {
      try {
        const feedbackResponse = await fetch("http://127.0.0.1:8080/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_feedback: userInput.trim(),
            context: latestMessage.text,
          }),
        });

        const data = await feedbackResponse.json();
        console.log('Response from http://127.0.0.1:8080/feedback end point url')
        console.log(JSON.stringify(data, null, 2))

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: data.context,
            sender: "bot",
            priorityIdentification: true,
            stage: "feedback",
          },
        ]);
      } catch (error) {
        console.error("Error sending feedback:", error);
        alert("Failed to send feedback");
      }
    } else {
      try {
        const response = await fetch(
          "http://localhost:8080/priority_identification",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ issue: userInput.trim() }),
          }
        );
        const data = await response.json();
        console.log('Response from http://127.0.0.1:8080/priority_identification end point url')
        console.log(data)
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: data,
            sender: "bot",
            priorityIdentification: true,
            stage: "priority_identification",
          },
        ]);
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to retrieve response");
      }
    }
  };

  return (
    <div>
      <div className="chatbot-icon-container" onClick={() => setIsOpen(!isOpen)}>
        <div className="chatbot-icon">
          <span>🤖</span>
        </div>
        {!isOpen && <span className="chatbot-text">I'm here to help</span>}
      </div>

      {isOpen && (
        <div className="chatbot-container open">
          <div className="chatbot-header" onClick={() => setIsOpen(false)}>
            <img src={logo} alt="Chatbot Logo" className="chatbot-logo" />
            <h3>GPN Chatbot</h3>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <span className="message-icon">
                  {msg.sender === "user" ? "👤" : "🤖"}
                </span>
                {/* <p id="rs" dangerouslySetInnerHTML={{ __html: msg.text }} /> */}
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
                        <br /><strong>JIRA Link:</strong> <a href={msg.text.jira_link} target="_blank" rel="noopener noreferrer">{msg.text.jira_id}</a> <br /><br />
                      </p>
                    )}

                    {/* Conditionally Display Whiteboard Information */}
                    {msg.text.white_board_id && (
                      <p id="rs">
                        <strong>White Board Information:</strong> <a href={msg.text.white_board_link} target="_blank" rel="noopener noreferrer">White Board</a> <br /><br />
                      </p>
                    )}

                    {/* Conditionally Display Status Page Information */}
                    {msg.text.status_io_id && (
                      <p id="rs">
                        <strong>Status IO Page Information:</strong> <a href={msg.text.status_io_page_link} target="_blank" rel="noopener noreferrer">Status IO Page</a> <br /><br />
                      </p>
                    )}
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
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );

}

export default Chatbot;