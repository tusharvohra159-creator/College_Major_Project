import { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import CodeExecuteService from "../services/codeExecuteService";
import langMap from "lang-map";
import { useFileSystem } from "./FileContext";
import { useSocket } from "./SocketContext";

const ExecuteCodeContext = createContext(null)

export const useExecuteCode = () => {
    const cxt = useContext(ExecuteCodeContext);
    if(cxt === null) {
        throw new Error("useExecuteCode must be used within a ExecuteCodeContextProvider");
    }
    return cxt;
}

const ExecuteCodeContextProvider = ({children}) => {

    const [terminalOutput, setTerminalOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [supportedLanguages, setSupportedLanguages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState({
        id: null,
        name: "",
    });
    const [isError, setIsError] = useState(false);

    const { activeFile } = useFileSystem();
    const { socket } = useSocket();
    const codeExecuteService = new CodeExecuteService();

    useEffect(() => {
        const fetchLanguagesAsync = async () => {
            try{
                const responseData = await codeExecuteService.getSupportedLanguages();
                if (responseData.error || !responseData.result) {
                    setSupportedLanguages([]);
                } else {
                    setSupportedLanguages(responseData.result || []);
                }
            }
            catch(err){
                console.log(err);
                setSupportedLanguages([]);
            }
        }
        fetchLanguagesAsync();
    }, []);

    useEffect(() => {
        if (!supportedLanguages || supportedLanguages.length === 0 || !activeFile?.name) return;
    
        const ext = activeFile.name.split(".").pop();
        if (ext) {
            const languageNames = langMap.languages(ext);
            if (languageNames && languageNames.length > 0) {
                const languageName = languageNames[0];
                const language = supportedLanguages.find(
                    (l) => l.name.toLowerCase().includes(languageName.toLowerCase())
                );
                if (language) {
                    setSelectedLanguage({
                        id: language.id,
                        name: language.name,
                    });
                }
            }
        } else {
            setSelectedLanguage({ id: null, name: "" });
        }
    }, [activeFile, supportedLanguages]);

    // Socket listeners for execution
    useEffect(() => {
        if (!socket) return;

        const handleExecuteOutput = ({ type, output }) => {
            setTerminalOutput(prev => prev + output);
        };

        const handleExecuteEnd = ({ code }) => {
            setIsRunning(false);
            if (code !== 0) {
                setIsError(true);
            }
        };

        socket.on('execute_output', handleExecuteOutput);
        socket.on('execute_end', handleExecuteEnd);

        return () => {
            socket.off('execute_output', handleExecuteOutput);
            socket.off('execute_end', handleExecuteEnd);
        };
    }, [socket]);
    
    const executeCode = () => {
        if(!selectedLanguage.id) {
            return toast.error("Please select a language");
        }
        if(!activeFile) {
            return toast.error("Please open a file to run the code");
        }

        setIsRunning(true);
        setIsError(false);
        setTerminalOutput(""); // Clear terminal on start
        
        // Send execution request via WebSocket instead of REST API
        socket.emit('execute_start', {
            code: activeFile.content,
            language_id: selectedLanguage.id
        });
    };

    const sendTerminalInput = useCallback((inputStr) => {
        if (socket && isRunning) {
            setTerminalOutput(prev => prev + inputStr + "\n");
            socket.emit('execute_input', { input: inputStr });
        }
    }, [socket, isRunning]);

    return (
        <ExecuteCodeContext.Provider
            value={{
                terminalOutput,
                isRunning,
                supportedLanguages,
                selectedLanguage,
                isError,
                setSelectedLanguage,
                executeCode,
                sendTerminalInput
            }}
        >
            {children}
        </ExecuteCodeContext.Provider>
    )
}

export { ExecuteCodeContextProvider };
export default ExecuteCodeContext;