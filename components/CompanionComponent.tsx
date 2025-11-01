'use client'

import configureAssistant, {cn, getSubjectColor} from "@/lib/utils";
import {useEffect, useRef, useState} from "react";
import {vapi} from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie, {LottieRefCurrentProps} from "lottie-react";
import soundwaves from '@/constants/soundwaves.json';
import {addToSessionHistory} from "@/lib/actions/companion.actions";

enum CallStatus{
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED="FINISHED"
}



const CompanionComponent = ({companionId,subject,topic,name,userName,userImage,style,voice}:CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);

    useEffect(() => {
        if(lottieRef){
            if(isSpeaking){
                lottieRef.current?.play()
            } else{
                lottieRef.current?.stop()
            }
        }
    }, [isSpeaking,lottieRef]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const onCallStart = () => {
            setCallStatus(CallStatus.ACTIVE);
            setMessages([]); // Clear messages on new call
        };

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            setIsSpeaking(false);
            addToSessionHistory(companionId);
        };

        const onMessage = (message: Message) => {
            if(message.type === 'transcript' && message.transcriptType === 'final'){
                const newMessage = {role : message.role, content: message.transcript};
                setMessages((prev)=>[newMessage, ...prev])
            }
        }

        const onError = (error: Error) => {
            console.error('Vapi Error:', error);
            setCallStatus(CallStatus.INACTIVE);
        };

        const onSpeechStart = () => {
            console.log('Speech started'); // Debug log
            setIsSpeaking(true);
        };

        const onSpeechEnd = () => {
            console.log('Speech ended'); // Debug log
            setIsSpeaking(false);
        };

        vapi.on('call-start',onCallStart);
        vapi.on('call-end',onCallEnd);
        vapi.on('message',onMessage);
        vapi.on('error',onError);
        vapi.on('speech-start',onSpeechStart);
        vapi.on('speech-end',onSpeechEnd);

        return () => {
            vapi.off('call-start',onCallStart);
            vapi.off('call-end',onCallEnd);
            vapi.off('message',onMessage);
            vapi.off('error',onError);
            vapi.off('speech-start',onSpeechStart);
            vapi.off('speech-end',onSpeechEnd);
        }
    },[]);

    const toggleMicrophone = () =>{
        if(callStatus !== CallStatus.ACTIVE) return;

        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
    }

    const handleCall = async () => {
        try {
            setCallStatus(CallStatus.CONNECTING);
            const assistant = configureAssistant(voice, style);
            const assistantOverrides = {
                variableValues: {
                    subject,
                    topic,
                    style
                },
                clientMessages:['transcript'],
                serverMessages:[],
            };

            console.log('Starting call with assistant:', assistant); // Debug log
            console.log('Overrides:', assistantOverrides); // Debug log

            //@ts-expect-error: type mismatch between vapi.start() and CreateAssistantDTO
            await vapi.start(assistant, assistantOverrides);
        } catch (error) {
            console.error("Failed to start call:", error);
            setCallStatus(CallStatus.INACTIVE);

            if (error instanceof Error) {
                if (error.message.includes('WebRTC')) {
                    alert("Unable to start session. Please ensure you're using HTTPS or localhost, and have granted microphone permissions.");
                } else {
                    alert(`Failed to start session: ${error.message}`);
                }
            }
        }
    }

    const handleDisconnect = async () => {
        try {
            await vapi.stop();
            setCallStatus(CallStatus.FINISHED);
        } catch (error) {
            console.error("Failed to disconnect:", error);
            setCallStatus(CallStatus.INACTIVE);
        }
    }

    return (
        <section className="flex flex-col">
            <section className="flex gap-8 max-sm:flex-col">
                <div className="companion-section">
                    <div className="companion-avatar"
                         style={{backgroundColor: getSubjectColor(subject)}}>
                        <div className={cn(
                            'absolute transition-opacity duration-1000',
                            callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100': 'opacity-0',
                            callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                        )}>
                            <Image
                                src={`/icons/${subject}.svg`}
                                alt={subject}
                                width={150}
                                height={150}
                                className="max-sm:w-fit"
                            />
                        </div>
                        <div className={cn(
                            'absolute transition-opacity duration-1000',
                            callStatus === CallStatus.ACTIVE ? 'opacity-100': 'opacity-0'
                        )}>
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                className="companion-lottie"
                            />
                        </div>
                    </div>
                    <p className="font-bold text-2xl">
                        {name}
                    </p>
                </div>
                <div className="user-section">
                    <div className="user-avatar">
                        <Image
                            src={userImage}
                            alt={userName}
                            width={130}
                            height={130}
                            className="rounded-lg"
                        />
                        <p className="font-bold text-2xl">
                            {userName}
                        </p>
                    </div>
                    <button
                        className="btn-mic"
                        onClick={toggleMicrophone}
                        disabled={callStatus !== CallStatus.ACTIVE}
                    >
                        <Image
                            src={isMuted ? `/icons/mic-off.svg` : '/icons/mic-on.svg'}
                            alt="mic"
                            width={36}
                            height={36}
                        />
                        <p className="max-sm:hidden">
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
                        </p>
                    </button>
                    <button
                        className={cn(
                            'rounded-lg py-2 cursor-pointer transition-colors w-full text-white',
                            callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary',
                            callStatus === CallStatus.CONNECTING && 'animate-pulse'
                        )}
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        disabled={callStatus === CallStatus.CONNECTING}
                    >
                        {callStatus === CallStatus.ACTIVE
                            ? "End Session"
                            : callStatus === CallStatus.CONNECTING
                                ? "Connecting..."
                                : "Start Session"}
                    </button>
                </div>
            </section>

            <section className="transcript">
                <div className="transcript-message no-scrollbar">
                    {messages.map((message, index)=>{
                        if(message.role === 'assistant'){
                            return (
                                <p key={index}
                                   className="max-sm:text-sm"
                                >
                                    {name.split('')[0]
                                        .replace('/[.,]/g, ','')} : {message.content}

                                </p>
                            )
                        } else{
                            return (
                                <p key={index} className="text-primary max-sm:text-sm">
                                    {userName} : {message.content}
                                </p>
                            )
                        }
                    })}

                </div>
                <div className="transcript-fade"/>


            </section>
        </section>
    )
}

export default CompanionComponent