import { createContext, useState } from 'react';

const MessageContext = createContext();


const MessageProvider = ({ children }) => {
    const [message, setMessage] = useState("");
    const [type, setType] = useState('info'); // 'info', 'success', 'error'

    const showMessage = (text, variant) => {
        setMessage(text);
        setType(variant || 'info');
        setTimeout(() => {
            setMessage("");
        }, 5000); // Clear error after 5 seconds
    };

    const clearMessage = () => {
        setMessage("");
    }
  return (
    <MessageContext.Provider value={{ message, type, showMessage, clearMessage }}>
      {children}
    </MessageContext.Provider>
  )
}

export { MessageContext, MessageProvider };