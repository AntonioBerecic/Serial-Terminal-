import React, { useState, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';
const socket = io('http://localhost:3001');

function App() {
    const [message, setMessage] = useState('');
    const [terminalOutput, setTerminalOutput] = useState('');
    const [baudRate, setBaudRate] = useState('9600');
    const [port, setPort] = useState(null);
    const [writer, setWriter] = useState(null);
    const [textDecoder] = useState(new TextDecoder());
    const [addLine, setAddLine] = useState(false);

    useEffect(() => {
        if (port) {
            listenToPort();
        }

        return () => {
            if (port) {
                port.close();
            }
        };
    }, [port]);

    useEffect(() => {
        const terminalDiv = document.getElementById("serialResults");
        terminalDiv.scrollTop = terminalDiv.scrollHeight;
    }, [terminalOutput]);

    const connectSerial = async () => {
        try {
            const selectedPort = await navigator.serial.requestPort();
            const baudRate = parseInt(document.getElementById("baud").value, 10);
            await selectedPort.open({ baudRate });

            const textEncoderStream = new TextEncoderStream();
            const writableStreamClosed = textEncoderStream.readable.pipeTo(selectedPort.writable);
            const writer = textEncoderStream.writable.getWriter();

            setPort(selectedPort);
            setWriter(writer);

            listenToPort();
        } catch (error) {
            console.error("Serial Connection Failed", error);
            alert("Serial Connection Failed");
        }
    };

    const listenToPort = async () => {
        if (port) {
            const reader = port.readable.getReader();
            let isFirstMessage = true; 
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    const decodedMessage = textDecoder.decode(value);
                    
                    if (isFirstMessage) {
                        isFirstMessage = false;
                        continue;
                    }
    
                    setTerminalOutput(prev => prev + decodedMessage);
                }
            } catch (error) {
                console.error("Error reading from port", error);
            } finally {
                reader.releaseLock();
            }
        }
    };

    const sendSerialLine = async () => {
        let dataToSend = message;
        if (addLine) dataToSend += "\n";
        await writer.write(dataToSend);
        setMessage('');
    };

    const changeBaudRate = (e) => {
        setBaudRate(e.target.value);
    };

    const clearTerminal = () => {
        setTerminalOutput('');
    };

    const handleCheckboxChange = (e) => {
        setAddLine(e.target.checked);
    };

    return (
        <div style={{ padding: '10px' }}>
            <div className="button-container">
                <button onClick={connectSerial}>Connect</button>
                Baud:
                <input
                    type="text"
                    id="baud"
                    list="baudList"
                    value={baudRate}
                    onChange={changeBaudRate}
                />
                <datalist id="baudList">
                    <option value="300">300</option>
                    <option value="1200">1200</option>
                    <option value="2400">2400</option>
                    <option value="4800">4800</option>
                    <option value="9600">9600</option>
                    <option value="19200">19200</option>
                    <option value="38400">38400</option>
                    <option value="57600">57600</option>
                    <option value="115200">115200</option>
                    <option value="250000">250000</option>
                </datalist>
                <button onClick={clearTerminal}>Clear</button>
                <input
                    type="checkbox"
                    id="addLine"
                    checked={addLine}
                    onChange={handleCheckboxChange}
                />
                <label htmlFor="addLine">Send with \n</label>
            </div>

            <div className="input-container">
                <input
                    type="text"
                    id="lineToSend"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                />
                <button onClick={sendSerialLine}>Send</button>
            </div>
            
            <br />
            <div id="serialResults">
                <pre>{terminalOutput}</pre>
            </div>
        </div>
    );
}

export default App;