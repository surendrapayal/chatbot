import React, { useState, useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Replace with your actual API endpoint
  const API_URL = 'https://api.example.com/upload';

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    // Add user message to chat
    const userMessage = {
      text: input || `Uploaded file: ${selectedFile?.name}`,
      sender: 'user',
      isFile: !!selectedFile,
      fileName: selectedFile?.name
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      
      if (selectedFile) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Add any additional data if needed
        if (input.trim()) {
          formData.append('message', input);
        }

        response = await axios.post(API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Handle text-only message
        // Replace with your text API endpoint if different
        response = await axios.post(API_URL, { message: input });
      }

      // Add bot response to chat
      setMessages(prev => [...prev, {
        text: response.data.message || 'Received your file successfully!',
        sender: 'bot'
      }]);
    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, {
        text: 'Sorry, there was an error processing your request.',
        sender: 'bot',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Optional: Auto-focus the text input after file selection
      setInput(`I want to upload ${file.name}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>File Upload Chatbot</h2>
        <p>Upload files and get responses from our API</p>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.isFile ? (
              <div className="file-message">
                <span className="file-icon">📄</span>
                <span className="file-name">{msg.fileName}</span>
              </div>
            ) : (
              <p className={msg.isError ? 'error-message' : ''}>{msg.text}</p>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="loading-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="chatbot-input-area">
        <button 
          className="file-upload-btn"
          onClick={() => fileInputRef.current.click()}
        >
          {selectedFile ? `✅ ${selectedFile.name}` : '📁 Attach File'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || (!input.trim() && !selectedFile)}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;