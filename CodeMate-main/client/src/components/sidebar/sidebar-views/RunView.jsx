import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useExecuteCode } from "../../../context/ExecuteCodeContext";
import { FaCaretDown } from "react-icons/fa";
import { IoCopyOutline } from "react-icons/io5";

const RunView = () => {
  const {
    terminalOutput,
    isRunning,
    supportedLanguages,
    selectedLanguage,
    setSelectedLanguage,
    executeCode,
    sendTerminalInput,
    isError
  } = useExecuteCode();

  const [currentInput, setCurrentInput] = useState("");
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const handleLngChange = (ev) => {
    if (!ev.target.value) {
      setSelectedLanguage({ id: null, name: "" });
      return;
    }
    try {
      const language = JSON.parse(ev.target.value);
      setSelectedLanguage(language);
    } catch (e) {
      console.error("Error parsing language selection:", e);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(terminalOutput);
    toast.success("Output copied to clipboard!");
  };

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput, currentInput]);

  const handleTerminalClick = () => {
    if (isRunning && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendTerminalInput(currentInput);
      setCurrentInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-4 space-y-5 border-black border-4 rounded-3xl">
      <h1 className="text-2xl font-bold text-gray-800">Code Runner</h1>

      {/* Language Selector */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Programming Language
        </label>
        <div className="relative">
          <select
            className="w-full bg-white border-2 border-gray-200 rounded-xl py-2.5 pl-4 pr-8 
                      appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                      transition-all duration-200 hover:border-gray-300 cursor-pointer"
            value={selectedLanguage?.id ? JSON.stringify(selectedLanguage) : ""}
            onChange={handleLngChange}
          >
            <option value="" className="text-gray-400">
              Select Language
            </option>
            {supportedLanguages
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((l, i) => (
                <option key={i} value={JSON.stringify(l)} className="text-gray-800">
                  {l.name}
                </option>
              ))}
          </select>
          <FaCaretDown className="absolute right-4 top-3.5 text-gray-500" />
        </div>
      </div>

      {/* Run Button */}
      <button
        className="w-full bg-black text-white py-3 rounded-xl font-semibold 
                  hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed 
                  transition-all duration-200 transform hover:scale-[1.01] shadow-sm"
        onClick={executeCode}
        disabled={isRunning}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-pulse">⚡</span> Executing...
          </span>
        ) : (
          "Run Code"
        )}
      </button>

      {/* Interactive Terminal Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-600">Interactive Terminal</label>
          <button 
            onClick={copyOutput}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 
                      hover:text-gray-800 tooltip"
            title="Copy Output"
          >
            <IoCopyOutline className="w-5 h-5" />
          </button>
        </div>
        
        <div 
          className={`flex-1 bg-gray-900 border-2 rounded-xl p-3 overflow-y-auto font-mono text-sm 
                     transition-colors shadow-inner ${isRunning ? 'border-blue-500 cursor-text' : 'border-gray-800'}`}
          onClick={handleTerminalClick}
          ref={terminalRef}
        >
          <pre className={`whitespace-pre-wrap break-words ${isError ? 'text-red-400' : 'text-green-400'}`}>
            {terminalOutput || "// Click 'Run Code' to start your program...\n// Type directly here when prompted for input."}
          </pre>
          
          {isRunning && (
            <div className="flex mt-1 text-green-400">
              <span className="mr-2">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="flex-1 bg-transparent outline-none text-green-400 font-mono"
                autoFocus
                spellCheck="false"
                autoComplete="off"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunView;