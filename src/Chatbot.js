import React, { useRef, useEffect, useState } from 'react';
import './Chatbot.css';
import logo from "./gpn.png";
import miclogo from "./microphone-svgrepo-com.svg";
//From 26464
import axios from 'axios';

let initial_input = ''
let flag = false;

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I assist you today?', sender: 'bot'}
  ]);

  const [userInput, setUserInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messageEndRef = useRef(null);
  const [recording, setRecording] = useState(false);

  //From 26464
  // const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [intentIdentificationForm, setIntentIdentificationForm] = useState({
    user_text: null,
    conversation_history: []
  });

  const [formState, setFormState] = useState({
    request_type: null,
    input: '',
    follow_up_question: null
  });

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // const handleInputChange = (e) => {
  //   setUserInput(e.target.value);
  // };

  //From 26464
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  //From 26464
  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // Check if event exists

    if (!userInput.trim()) return;

    const userMessage = { text: userInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {

      if (initial_input === '') {
        initial_input = userInput;
        flag = true;
      }

      const updatedState = { ...formState, input: userInput };
      const intentIdentificationFormState = { ...intentIdentificationForm, user_text: userInput };
      // Determine which endpoint to call based on the current state
      // /intent_identification
      let endpoint = '';
      let requestData = updatedState;

      console.log("initial_input")
      console.log(initial_input)
      const latestBotMessage = [...messages].reverse().find(msg => msg.sender === 'bot');

      if(latestBotMessage.text === 'Hello! How can I assist you today?'){
        endpoint = '/intent_identification';
        requestData = intentIdentificationFormState;
      }else if (latestBotMessage?.text?.intent === 'UNKNOWN') {
        endpoint = '/intent_identification';
        requestData = intentIdentificationFormState;
      }else if (latestBotMessage?.text?.intent === 'TICKET_CREATION' || (latestBotMessage?.text?.request_type) ) {
        endpoint = '/get_ticket_information';
        if (flag) {
          requestData = { ...updatedState, input: initial_input };
          flag = false;
        } else {
          requestData = updatedState;
        }
        if (userInput.toLowerCase() === 'confirm' && !latestBotMessage.text?.intent_confirmation_message) {
          endpoint = '/create_ticket';
          // requestData = { ...updatedState, is_create_ticket: 'Confirm' };
          requestData = { ...updatedState };
        }
      }


      // if (!latestBotMessage.text?.intent || latestBotMessage.text.intent === 'UNKNOWN') {
      //   endpoint = '/intent_identification';
      //   requestData = intentIdentificationFormState;
      //   // } else if ((!latestBotMessage?.intent || latestBotMessage.intent === 'UNKNOWN') && latestBotMessage?.value === 'TICKET_CREATION') {
      // } else if (latestBotMessage.text?.intent && latestBotMessage.text.intent === 'TICKET_CREATION') {
      //   endpoint = '/get_ticket_information';
      //   if (flag) {
      //     requestData = { ...updatedState, input: initial_input };
      //   } else {
      //     requestData = updatedState;
      //   }

      //   if (userInput.toLowerCase() === 'confirm' && !latestBotMessage.text?.intent_confirmation_message) {
      //     endpoint = '/create_ticket';
      //     // requestData = { ...updatedState, is_create_ticket: 'Confirm' };
      //     requestData = { ...updatedState };
      //   }
      // } else {

      // }


      // // If we're in confirmation mode and user confirms, call create_ticket
      // // if (formState.is_create_ticket && userInput.toLowerCase() === 'confirm') {
      // if (userInput.toLowerCase() === 'confirm') {
      //   endpoint = '/create_ticket';
      //   // requestData = { ...updatedState, is_create_ticket: 'Confirm' };
      //   requestData = { ...updatedState };
      // }

      console.log("endpoint")
      console.log(endpoint)

      // const response = await axios.post('http://localhost:8080/get_ticket_information', updatedState);
      const response = await axios.post(`http://localhost:8080${endpoint}`, requestData);
      console.log(response)
      // const botResponse = response.data.follow_up_question ||
      //   "Thank you for providing all the information. Your ticket has been created!";
      const botResponse = response.data

      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);

      // if (!latestBotMessage.text?.intent || latestBotMessage.text.intent === 'UNKNOWN') {
      //   setIntentIdentificationForm(response.data);
      //   // initial_input = response.data.conversation_history
      //   // console.log("initial_input")
      //   // console.log(latestBotMessage.text.conversation_history)
      //   // console.log(initial_input)
      // }
      // else {
      //   setFormState(response.data);
      // }

      if(latestBotMessage.text === 'Hello! How can I assist you today?'){
        setIntentIdentificationForm(response.data);
      }else if (latestBotMessage?.text?.intent === 'UNKNOWN') {
        setIntentIdentificationForm(response.data);
      }else if (latestBotMessage?.text?.intent === 'TICKET_CREATION' || (latestBotMessage?.text?.request_type) ) {
        setFormState(response.data);
      }


    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'bot'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const startRecording = async () => {
    setRecording(true);
    try {
      setUserInput('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('http://localhost:5000/api/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          setUserInput(data.transcription);
        } catch (error) {
          console.error('Transcription error:', error);
        }
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
        setRecording(false);
      }, 5000);
    } catch (error) {
      console.error('Recording error:', error);
      setRecording(false);
    }
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
                {msg.sender === 'user' && <p id="rs" dangerouslySetInnerHTML={{ __html: msg.text }} />}
                {/* <p id="rs" dangerouslySetInnerHTML={{ __html: msg.text }} /> */}
                {msg.sender === 'bot' && !msg.text?.intent && !msg.text.request_type && (
                  <p id="rs" dangerouslySetInnerHTML={{ __html: msg.text }} />
                )}
                {msg.sender === 'bot' && msg.text?.intent && (
                  <p id="rs">
                    {/* {!msg.text.follow_up && (
                      <div><strong>{msg.text.intent_information_message}</strong><br /><br /></div>
                    )} */}
                    <strong>Intent: </strong>{msg.text.intent}  <br /><br />
                    {msg.text.follow_up && Array.isArray(msg.text.follow_up) && (
                      <div>
                        <strong>Please provide more detail:</strong>
                        <ul>
                          {msg.text.follow_up.map((question, index) => (
                            // <li key={index}>
                            //   {question}
                            // </li>
                            <div key={index}>
                              {index + 1}. {question}
                            </div>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* <strong>{msg.text.follow_up}</strong>  <br /><br /> */}
                    {!msg.text.follow_up && (
                      <div><strong>{msg.text.intent_confirmation_message}</strong><br /><br /></div>
                    )}
                  </p>

                )}
                {/* {msg.sender === 'bot' && msg.text.is_create_ticket === "Confirm" && msg.text.ticket_confirmation && (
                  <p id="rs">
                    <div>{msg.text.ticket_confirmation}<br /><br /></div>
                  </p>)} */}
                {msg.sender === 'bot' && msg.text.request_type === "General Support Ticket" && !msg.text.ticket_confirmation && (
                  <p id="rs">
                    {!msg.text.follow_up_question && (
                      <div><strong>{msg.text.information_message}</strong><br /><br /></div>
                    )}
                    <strong>Who are you filling this out for:</strong> {msg.text.issue_filling_for} <br /><br />
                    <strong>Email:</strong> {msg.text.email} <br /><br />
                    <strong>Full Name:</strong> {msg.text.full_name} <br /><br />
                    <strong>Contact Method:</strong> {msg.text.contact_method} <br /><br />
                    <strong>Contact Number:</strong> {msg.text.contact_number} <br /><br />
                    <strong>Organization:</strong> {msg.text.organization} <br /><br />
                    <strong>Contact Person:</strong> {msg.text.contact_person} <br /><br />
                    <strong>Are you working remotely:</strong> {msg.text.is_working_remotely} <br /><br />
                    <strong>Who is you issue affecting:</strong> {msg.text.issue_affecting} <br /><br />
                    <strong>Issue Priority:</strong> {msg.text.issue_priority} <br /><br />
                    <strong>Site:</strong> {msg.text.site} <br /><br />
                    <strong>Support Category:</strong> {msg.text.support_category} <br /><br />
                    <strong>Purpose Of Request:</strong> {msg.text.purpose_of_request} <br /><br />
                    <strong>Type Of Request:</strong> {msg.text.request_type} <br /><br />
                    {/* <strong>Follow Up Question:</strong> {msg.text.follow_up_question} <br /><br /> */}
                    {msg.text.follow_up_question && (
                      <div>
                        <br /><br /><strong>Follow Up Question:</strong>
                        <div>
                          {msg.text.follow_up_question
                            .split('\n')
                            .filter(q => q.trim() !== '')
                            .map((q, index) => (
                              <div key={index}>
                                {index + 1}. {q.trim()}.
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {!msg.text.follow_up_question && (
                      <div><strong>{msg.text.confirmation_message}</strong><br /><br /></div>
                    )}
                  </p>)}


                {msg.sender === 'bot' && msg.text.request_type === "Order Equipment Ticket" && !msg.text.ticket_confirmation && (
                  <p id="rs">
                    {!msg.text.follow_up_question && (
                      <div><strong>{msg.text.information_message}</strong><br /><br /></div>
                    )}
                    <strong>Requestor Email:</strong> {msg.text.requester_email} <br /><br />
                    <strong>Contact Method:</strong> {msg.text.contact_method} <br /><br />
                    <strong>Contact Number:</strong> {msg.text.contact_number} <br /><br />
                    <strong>Approval Email:</strong> {msg.text.manager_email} <br /><br />
                    <strong>Department Code:</strong> {msg.text.department_code} <br /><br />
                    <strong>Are you requesting this equipment for yourself?:</strong> {msg.text.is_requesting_for_yourself} <br /><br />
                    <strong>Equipment is for a new hire?:</strong> {msg.text.is_equipment_for_new_hire} <br /><br />
                    <strong>Email Address:</strong> {msg.text.email_address} <br /><br />
                    <strong>Requested For Name:</strong> {msg.text.requested_for_name} <br /><br />
                    <strong>Employee:</strong> {msg.text.employee} <br /><br />
                    <strong>Country:</strong> {msg.text.country} <br /><br />
                    <strong>Site:</strong> {msg.text.site} <br /><br />
                    <strong>Purpose Of Request:</strong> {msg.text.purpose_of_request} <br /><br />
                    <strong>Type Of Request:</strong> {msg.text.request_type} <br /><br />
                    {/* <strong>Follow Up Question:</strong> {msg.text.follow_up_question} <br /><br /> */}
                    {msg.text.follow_up_question && (
                      <div>
                        <br /><br /><strong>Follow Up Question:</strong>
                        <div>
                          {msg.text.follow_up_question
                            .split('\n')
                            .filter(q => q.trim() !== '')
                            .map((q, index) => (
                              <div key={index}>
                                {index + 1}. {q.trim()}.
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {!msg.text.follow_up_question && (
                      <div><strong>{msg.text.confirmation_message}</strong><br /><br /></div>
                    )}
                  </p>)}
                {/* {msg.sender === 'bot' && msg.text?.is_create_ticket?.toLowerCase() === "confirm" && !msg.text.ticket_confirmation && (
                  <p id="rs">
                    <div><strong>{msg.text.ticket_confirmation}</strong><br /><br /></div>
                  </p>)} */}

                {/* {msg.sender === 'bot' && msg.text.is_create_ticket === "Confirm" && msg.text.ticket_confirmation && (() => { */}
                {msg.sender === 'bot' && msg.text.ticket_confirmation && (() => {
                  const parts = msg.text.ticket_confirmation.split(/(#[a-f0-9-]+)/i); // Split around the ticket ID
                  return (
                    <p id="rs">
                      <div>
                        {parts.map((part, index) =>
                          part.startsWith('#') ? <strong key={index}>{part}</strong> : part
                        )}
                        <br /><br />
                      </div>
                    </p>
                  );
                })()}

                {/* {msg.priorityIdentification && (
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
                    )} */}


              </div>
            ))}
            {/* {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                {message.text}
              </div>
            ))} */}
            {isLoading && (
              <div className="message bot">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messageEndRef}></div>
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={userInput}
              onChange={handleInputChange}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            // onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button onClick={handleSubmit}>Send</button>
            <button
              onClick={startRecording}
              className={recording ? 'recording' : ''}
              disabled={recording}
            >
              {recording ? <span className="wave-animation">🎙️</span> : <img src={miclogo} alt="Mic" width="15" className="mic-icon" />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
