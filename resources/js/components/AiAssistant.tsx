import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Send,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  Stethoscope,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Download,
  Copy,
  RefreshCw,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  X
} from 'lucide-react';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  images?: string[];
  confidence?: number;
  rationale?: string;
  differentialDiagnoses?: string[];
  recommendedActions?: string[];
  safetyWarnings?: string[];
  urgencyLevel?: 'routine' | 'high' | 'emergency';
  processingTime?: number;
  modelUsed?: string;
  serviceUsed?: string;
  tokensUsed?: number;
  feedback?: number;
}

interface ImageUpload {
  file: File;
  preview: string;
  id: string;
  status: 'uploading' | 'ready' | 'error';
}

const AiAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState<ImageUpload[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [contextMode, setContextMode] = useState<'general' | 'diagnosis' | 'education'>('general');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sendMessage,
    analyzeImages,
    generateDifferentialDiagnosis,
    isLoading,
    error,
    rateLimitStatus
  } = useAiAssistant();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Add comprehensive welcome message
    const welcomeMessage: Message = {
      id: '1',
      type: 'ai',
      content: `Bună ziua, ${user?.name?.split(' ')[0]}! Sunt IzaAI, asistentul dumneavoastră medical pentru educație și suport în luarea deciziilor clinice.

**Ce pot face pentru dumneavoastră:**
• Furnizez informații medicale educaționale bazate pe evidențe
• Ajut la diagnostic diferențial pentru scopuri educaționale
• Analizez imagini medicale (când sunt disponibile)
• Ofer recomandări pentru investigații și tratamente
• Răspund la întrebări despre afecțiuni medicale
• Sprijin în luarea deciziilor clinice

**Cum să mă folosiți eficient:**
• Fiți cât mai specific cu întrebările
• Includeți vârsta, sexul și simptomele relevante
• Încărcați imagini medicale pentru analiză
• Specificați contextul medical dacă este relevant

Cum vă pot ajuta astăzi?`,
      timestamp: new Date(),
      confidence: 0.95,
      safetyWarnings: [
        'Sunt un instrument de suport educațional, nu de diagnostic',
        'Toate recomandările trebuie verificate de profesioniști medicali calificați',
        'Pentru urgențe medicale, contactați imediat serviciile de urgență - 112'
      ],
      urgencyLevel: 'routine'
    };

    setMessages([welcomeMessage]);
  }, [user?.name]);

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedImages.length === 0) || isLoading) return;

    // Check rate limits
    if (rateLimitStatus && rateLimitStatus.remaining <= 0) {
      alert('Ați atins limita de cereri. Încercați din nou mai târziu.');
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      images: uploadedImages.map(img => img.preview)
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      let response;

      if (uploadedImages.length > 0) {
        setIsAnalyzing(true);
        response = await analyzeImages({
          images: uploadedImages.map(img => img.file),
          context: inputMessage,
          sessionId,
          userRole: user?.roles?.[0] || 'student'
        });
        setUploadedImages([]);
      } else if (contextMode === 'diagnosis' && inputMessage.includes('simptom')) {
        // Extract symptoms for differential diagnosis
        const symptoms = extractSymptoms(inputMessage);
        response = await generateDifferentialDiagnosis({
          symptoms,
          age: extractAge(inputMessage),
          gender: extractGender(inputMessage),
          sessionId,
          context: inputMessage
        });
      } else {
        response = await sendMessage({
          message: inputMessage,
          sessionId,
          context: {
            userRole: user?.roles?.[0] || 'student',
            specialty: user?.specialization,
            institution: user?.institution,
            contextMode
          }
        });
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: response.data.ai_response || response.data.summary,
        timestamp: new Date(),
        confidence: response.data.confidence_score,
        rationale: response.data.rationale_explanation,
        differentialDiagnoses: response.data.differential_diagnoses,
        recommendedActions: response.data.recommended_actions,
        safetyWarnings: response.data.safety_warnings,
        urgencyLevel: response.data.urgency_level,
        processingTime: response.data.processing_time,
        modelUsed: response.data.model_used,
        serviceUsed: response.data.service_used,
        tokensUsed: response.data.tokens_used
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-focus textarea for continued conversation
      setTimeout(() => textareaRef.current?.focus(), 100);

    } catch (error: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: 'Ne cerem scuze, a apărut o eroare în procesarea solicitării dumneavoastră. Vă rugăm să încercați din nou sau să consultați un specialist medical.',
        timestamp: new Date(),
        confidence: 0,
        safetyWarnings: [
          'Eroare de sistem - consultați un profesionist medical pentru asistență',
          'Pentru urgențe medicale, apelați 112'
        ],
        urgencyLevel: 'high'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).slice(0, 5).forEach(file => {
      if (file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) { // 10MB limit
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: ImageUpload = {
            file,
            preview: e.target?.result as string,
            id: crypto.randomUUID(),
            status: 'ready'
          };
          setUploadedImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Fișierul trebuie să fie o imagine și să aibă maximum 10MB.');
      }
    });
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, feedback: rating } : msg
        )
      );
      // Submit feedback to backend
      // await submitFeedback(messageId, rating);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Show success toast
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadConversation = () => {
    const conversationText = messages.map(msg => 
      `[${msg.type.toUpperCase()}] ${msg.timestamp.toLocaleString('ro-RO')}\n${msg.content}\n\n`
    ).join('');

    const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `izaai-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const extractSymptoms = (text: string): string[] => {
    // Simple symptom extraction logic
    const symptomWords = ['durere', 'febră', 'tuse', 'dispnee', 'amețeală', 'greață', 'vomă'];
    return symptomWords.filter(symptom => text.toLowerCase().includes(symptom));
  };

  const extractAge = (text: string): number | undefined => {
    const ageMatch = text.match(/(\d+)\s*(ani|an)/);
    return ageMatch ? parseInt(ageMatch[1]) : undefined;
  };

  const extractGender = (text: string): string | undefined => {
    if (text.toLowerCase().includes('bărbat') || text.toLowerCase().includes('masculin')) {
      return 'masculin';
    }
    if (text.toLowerCase().includes('femeie') || text.toLowerCase().includes('feminin')) {
      return 'feminin';
    }
    return undefined;
  };

  const getUrgencyColor = (level?: string) => {
    switch (level) {
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getUrgencyIcon = (level?: string) => {
    switch (level) {
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Clock className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Bot className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Asistent AI Medical - IzaAI</CardTitle>
                  <p className="text-blue-100">
                    Suport educațional și asistență în luarea deciziilor clinice
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <Zap className="h-3 w-3 mr-1" />
                  {rateLimitStatus?.remaining || 0} cereri rămase
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={downloadConversation}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Mode Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {[
                  { key: 'general', label: 'General', icon: MessageCircle },
                  { key: 'diagnosis', label: 'Diagnostic', icon: Stethoscope },
                  { key: 'education', label: 'Educație', icon: FileText }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={contextMode === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContextMode(key as any)}
                    className="flex items-center"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Opțiuni Avansate
              </Button>
            </div>

            {showAdvancedFeatures && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Configurări AI</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Model:</span>
                    <p className="font-medium">Groq Llama-3.1-70B</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Serviciu:</span>
                    <p className="font-medium">Hibrid (Groq + Ollama)</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Context:</span>
                    <p className="font-medium">{user?.specialization || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Limbă:</span>
                    <p className="font-medium">Română</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Disclaimer */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>IMPORTANT:</strong> Acest asistent AI este destinat exclusiv educației medicale și sprijinului în luarea deciziilor. 
            NU înlocuiește consultația medicală profesională și NU poate furniza diagnostice medicale. 
            Pentru urgențe medicale, contactați imediat serviciile de urgență - <strong>112</strong>.
          </AlertDescription>
        </Alert>

        {/* Chat Messages */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-purple-100 text-purple-600'
                  )}>
                    {message.type === 'user' 
                      ? user?.name?.[0] || 'U' 
                      : <Bot className="h-5 w-5" />
                    }
                  </div>

                  {/* Message Content */}
                  <div className={cn(
                    "flex-1 max-w-3xl",
                    message.type === 'user' ? 'flex flex-col items-end' : ''
                  )}>
                    <div className={cn(
                      "rounded-2xl p-4 shadow-sm",
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200'
                    )}>
                      {/* Main Message */}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>

                      {/* Images */}
                      {message.images && message.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {message.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {/* Message Actions */}
                      {message.type === 'ai' && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                              className="h-7 px-2 text-xs"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <span className="text-xs text-gray-400">
                              {message.processingTime && `${message.processingTime}s`}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(message.id, 5)}
                              className={cn(
                                "h-7 w-7 p-0",
                                message.feedback === 5 ? 'text-green-600' : 'text-gray-400'
                              )}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(message.id, 1)}
                              className={cn(
                                "h-7 w-7 p-0",
                                message.feedback === 1 ? 'text-red-600' : 'text-gray-400'
                              )}
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Response Details */}
                    {message.type === 'ai' && (
                      <div className="mt-3 space-y-3 max-w-3xl">
                        {/* Confidence and Urgency */}
                        <div className="flex items-center space-x-3">
                          {message.confidence !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Încredere: {Math.round(message.confidence * 100)}%
                            </Badge>
                          )}
                          {message.urgencyLevel && (
                            <Badge className={cn("text-xs", getUrgencyColor(message.urgencyLevel))}>
                              {getUrgencyIcon(message.urgencyLevel)}
                              <span className="ml-1">
                                {message.urgencyLevel === 'emergency' ? 'Urgență' :
                                 message.urgencyLevel === 'high' ? 'Prioritate Mare' : 'Rutină'}
                              </span>
                            </Badge>
                          )}
                        </div>

                        {/* Differential Diagnoses */}
                        {message.differentialDiagnoses && message.differentialDiagnoses.length > 0 && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-3">
                              <h5 className="font-semibold text-sm text-blue-800 mb-2">
                                Diagnostic diferențial de considerat:
                              </h5>
                              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                                {message.differentialDiagnoses.map((diagnosis, index) => (
                                  <li key={index}>{diagnosis}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {/* Recommended Actions */}
                        {message.recommendedActions && message.recommendedActions.length > 0 && (
                          <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-3">
                              <h5 className="font-semibold text-sm text-green-800 mb-2">
                                Acțiuni recomandate:
                              </h5>
                              <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                                {message.recommendedActions.map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {/* Safety Warnings */}
                        {message.safetyWarnings && message.safetyWarnings.length > 0 && (
                          <Card className="bg-red-50 border-red-200">
                            <CardContent className="p-3">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h5 className="font-semibold text-sm text-red-800 mb-2">
                                    Avertismente importante:
                                  </h5>
                                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                    {message.safetyWarnings.map((warning, index) => (
                                      <li key={index}>{warning}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Rationale */}
                        {message.rationale && (
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium text-gray-600 hover:text-gray-800">
                              Explicația răspunsului AI
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded text-gray-600">
                              {message.rationale}
                            </div>
                          </details>
                        )}

                        {/* Technical Details */}
                        {showAdvancedFeatures && (
                          <div className="text-xs text-gray-500 flex items-center space-x-4">
                            {message.modelUsed && <span>Model: {message.modelUsed}</span>}
                            {message.serviceUsed && <span>Serviciu: {message.serviceUsed}</span>}
                            {message.tokensUsed && <span>Token-uri: {message.tokensUsed}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString('ro-RO')}
                    </div>
                  </div>
                </div>
              ))}

              {(isLoading || isAnalyzing) && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="animate-spin h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-600">
                          {isAnalyzing ? 'Analizez imaginile medicale...' : 'IzaAI procesează solicitarea...'}
                        </span>
                      </div>
                      {rateLimitStatus?.remaining !== undefined && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">
                            Utilizare API: {rateLimitStatus.requests_used || 0}/{rateLimitStatus.requests_limit}
                          </div>
                          <Progress 
                            value={(rateLimitStatus.requests_used / rateLimitStatus.requests_limit) * 100} 
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Image Upload Preview */}
        {uploadedImages.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Imagini pentru analiză medicală:</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt="Medical image for analysis"
                      className="w-full h-24 object-cover rounded-lg border-2 border-dashed border-gray-300"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1">
                      <Badge 
                        variant={image.status === 'ready' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {image.status === 'ready' ? 'Gata' : 'Procesare...'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Area */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                placeholder={`Descrieți simptomele, adresați o întrebare medicală sau cereți analiză de imagini...\n\nExemple:\n• "Pacient de 45 ani cu durere toracică și dispnee"\n• "Care sunt complicațiile diabetului zaharat?"\n• "Analizați această radiografie toracică"`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500"
                disabled={isLoading}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || uploadedImages.length >= 5}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Încarcă Imagini
                  </Button>
                  <span className="text-xs text-gray-500">
                    Max 5 imagini, 10MB fiecare • Suportate: JPEG, PNG, WebP
                  </span>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && uploadedImages.length === 0) || isLoading}
                  className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Se procesează...' : 'Trimite'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 hover:bg-blue-50 hover:border-blue-200"
            onClick={() => setInputMessage('Care sunt simptomele pentru hipertensiunea arterială și cum se diagnostichează?')}
          >
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium">Întrebări despre Simptome</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 hover:bg-purple-50 hover:border-purple-200"
            onClick={() => setInputMessage('Explică-mi protocolul de tratament pentru diabetul zaharat tip 2')}
          >
            <MessageCircle className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium">Protocoale de Tratament</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col space-y-2 hover:bg-green-50 hover:border-green-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium">Analizează Imagini Medicale</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
