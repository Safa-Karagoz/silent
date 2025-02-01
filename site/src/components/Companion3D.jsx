import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useChatStore } from '@/pages/api/model/chat-store';
import { useSession } from 'next-auth/react';
import * as THREE from 'three';
import AutoplayTextToSpeech from './AutoplayTextToSpeech';

const SpeechHandler = ({ isListening, setIsListening, voiceId, setLastResponse, hasAudioPermission }) => {
  const recognition = useRef(null);
  const { addMessage, currentUserId, getCurrentUserMessages, addResponse } = useChatStore();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const startTimeRef = useRef(null);

  const handleApiCall = async (transcript) => {
    if (!session?.user?.email) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/model/cf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.email,
          conversationMessages: getCurrentUserMessages(),
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
  
      const data = await response.json();
      addResponse(session.user.email, data.modelResponse);
      setLastResponse(data.modelResponse);  // Add this line
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (window.webkitSpeechRecognition && hasAudioPermission) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = false;

      recognition.current.onstart = () => {
        startTimeRef.current = Date.now();
      };

      recognition.current.onresult = async (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        const duration = (Date.now() - startTimeRef.current) / 1000; 
        console.log('Speech recognition result:', transcript);
        
        if (transcript.trim() && duration > 3) {
          // Add user message to chat store
          addMessage(currentUserId, {
            role: 'user',
            content: transcript,
          });
          
          // Make API call with the transcript
          await handleApiCall(transcript);
        }
      };

      recognition.current.onend = () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        console.log('Speech recognition ended. Duration:', duration, 'seconds');
        setIsListening(false);
        startTimeRef.current = null;
      };


      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError('Speech recognition error occurred');
        startTimeRef.current = null;
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      startTimeRef.current = null;
    };
  }, [addMessage, setIsListening, session, hasAudioPermission]);

  useEffect(() => {
    if (isListening && recognition.current) {
      recognition.current.start();
    } else if (!isListening && recognition.current) {
      recognition.current.stop();
    }
  }, [isListening]);

  return null;
};

const OrbitalPaths = () => {
  const pathsRef = useRef();
  const materialRef = useRef();
  const [scaleFactors, setScaleFactors] = useState([1, 1, 1]);
  const analyzerRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Set up audio context and analyzer
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyzerRef.current);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioLevel = () => {
    if (!analyzerRef.current) return 1;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);

    // Calculate the average volume level
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    
    // Normalize between 1 and 2 with some dampening
    return 1 + (average / 255) * 0.5;
  };

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec3 accent = vec3(0.831, 0.514, 0.067);
      vec3 secondary = vec3(0.412, 0.459, 0.396);
      
      float flow = fract(vUv.x - uTime * 0.2);
      float intensity = smoothstep(0.0, 0.2, flow) * smoothstep(1.0, 0.8, flow);
      
      float colorMix = sin(vPosition.x * 2.0 + uTime) * 0.5 + 0.5;
      vec3 color = mix(accent, secondary, colorMix);
      
      float glow = exp(-flow * 3.0) * 0.5;
      color = mix(color, accent, glow);
      
      float edgeFade = smoothstep(0.0, 0.1, intensity) * smoothstep(1.0, 0.9, intensity);
      
      gl_FragColor = vec4(color, edgeFade * 0.7);
    }
  `;

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      float displacement = sin(pos.x * 5.0 + uTime) * cos(pos.y * 5.0 + uTime) * 0.05;
      pos += normal * displacement;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (pathsRef.current) {
      pathsRef.current.rotation.y += 0.008;
      pathsRef.current.rotation.z += 0.005;
    }

    // Update scale factors based on audio level
    const audioLevel = getAudioLevel();
    setScaleFactors([audioLevel, audioLevel, audioLevel]);
  });

  const createOrbitalPath = (radius, height, turns, scaleFactor) => {
    const points = [];
    const segments = 256;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      const x = Math.cos(angle) * radius * scaleFactor;
      const y = Math.sin(angle) * radius * scaleFactor;
      const z = Math.sin(t * Math.PI * 2) * height * scaleFactor;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return new THREE.CatmullRomCurve3(points);
  };

  const createTubeGeometry = (curve) => {
    return new THREE.TubeGeometry(curve, 128, 0.015, 8, false);
  };

  const paths = [
    { radius: 0.7, height: 0.2, turns: 2, rotation: [0, 0, 0] },
    { radius: 0.8, height: 0.4, turns: 3.14, rotation: [0, Math.PI / 4, 0] },
    { radius: 0.5, height: 0.3, turns: 3, rotation: [Math.PI / 3, 0, 0] },

  ];

  return (
    <group ref={pathsRef}>
      {paths.map((path, index) => (
        <mesh key={index} rotation={path.rotation}>
          <primitive
            object={createTubeGeometry(
              createOrbitalPath(path.radius, path.height, path.turns, scaleFactors[index])
            )}
          />
          <shaderMaterial
            ref={materialRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
              uTime: { value: 0 }
            }}
            transparent={true}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// CoreParticle component modified to handle clicks
const CoreParticle = ({ isListening, onClick }) => {
  const coreRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (coreRef.current) {
      const pulseIntensity = isListening ? 0.2 : 0.1;
      const pulseSpeed = isListening ? 4 : 2;
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseIntensity;
      coreRef.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
    }
    if (glowRef.current) {
      const glowPulseIntensity = isListening ? 0.25 : 0.15;
      const glowPulse = Math.sin(state.clock.elapsedTime * 2) * glowPulseIntensity + 1.15;
      glowRef.current.scale.set(glowPulse, glowPulse, glowPulse);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    setIsListening(prev => !prev);
  };

  return (
    <group onClick={onClick} style={{ cursor: 'pointer' }}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshPhongMaterial
          color={isListening ? "#FF6B6B" : "#D48311"}
          emissive={isListening ? "#FF6B6B" : "#D48311"}
          emissiveIntensity={isListening ? 3 : 2}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhongMaterial
          color={isListening ? "#FF6B6B" : "#D48311"}
          emissive={isListening ? "#FF6B6B" : "#D48311"}
          emissiveIntensity={isListening ? 2 : 1.5}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshPhongMaterial
          color={isListening ? "#FF6B6B" : "#D48311"}
          emissive={isListening ? "#FF6B6B" : "#D48311"}
          emissiveIntensity={isListening ? 1.5 : 1}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
};

const Companion3D = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceId, setVoiceId] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const { data: session } = useSession();

  // Create a silent audio blob for permission request
  const silentAudioBlob = new Blob(
    [new Uint8Array([255, 227, 24, 196, 0, 0, 0, 3, 72, 1, 64, 0, 0, 4, 132, 16, 31, 227, 192]).buffer],
    { type: 'audio/mpeg' }
  );
  const silentAudioUrl = URL.createObjectURL(silentAudioBlob);

  // Check for existing audio permission on mount
  useEffect(() => {
    const checkAudioPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasAudioPermission(true);
      } catch (error) {
        console.error('No audio permission:', error);
        setHasAudioPermission(false);
      }
    };

    checkAudioPermission();
  }, []);

  // Fetch voice ID when session is available
  useEffect(() => {
    const fetchVoiceId = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/get-companion-voice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.email }),
        });
        
        if (!response.ok) throw new Error('Failed to fetch voice ID');
        
        const data = await response.json();
        setVoiceId(data.companionVoiceId);
      } catch (error) {
        console.error('Error fetching voice ID:', error);
      }
    };

    fetchVoiceId();
  }, [session?.user?.email]);

  const requestAudioPermission = async () => {
    try {
      // Play silent audio to trigger permission
      const audio = new Audio(silentAudioUrl);
      audio.volume = 0.01;
      
      const playPromise = audio.play();
      await playPromise;
      
      setTimeout(() => {
        audio.pause();
        audio.remove();
      }, 1);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setHasAudioPermission(true);
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      setHasAudioPermission(false);
      return false;
    }
  };

  const handleCoreClick = async (e) => {
    e.stopPropagation();
    
    if (!hasAudioPermission) {
      const granted = await requestAudioPermission();
      if (!granted) {
        // Maybe show a notification to the user about needing permissions
        return;
      }
    }

    setIsListening(prev => !prev);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background pb-20 pt-2">
      <SpeechHandler 
        isListening={isListening} 
        setIsListening={setIsListening}
        voiceId={voiceId}
        setLastResponse={setLastResponse}
        hasAudioPermission={hasAudioPermission}
      />
      <div className="w-[600px] h-[600px]">
        <Canvas 
          camera={{ 
            position: [0, 0, 2.5], 
            fov: 50,
            near: 0.1,
            far: 1000
          }}
        >
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          <group scale={0.5}>
            <CoreParticle 
              isListening={isListening} 
              onClick={handleCoreClick}
            />
            <OrbitalPaths />
          </group>
        </Canvas>
      </div>
      {isListening && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-primary text-text px-4 py-2 rounded-full shadow-lg">
          Listening... (Click again to stop)
        </div>
      )}
      {lastResponse && voiceId && (
        <AutoplayTextToSpeech 
          text={lastResponse} 
          voiceId={voiceId}
          key={lastResponse}
        />
      )}
    </div>
  );
};

export default Companion3D;