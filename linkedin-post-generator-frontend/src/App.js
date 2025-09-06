/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Upload, Wand2, Send, Linkedin, Sparkles, ArrowRight, Edit3, Check, X } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from './config';

const GeneratedPostPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { generatedPost, postId, userInfo, files } = state;

  const [isEditing, setIsEditing] = useState(false);
  const [editablePost, setEditablePost] = useState(generatedPost || '');
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [postPublished, setPostPublished] = useState(false);

  
  useEffect(() => {
    if (!generatedPost) {
      navigate('/generate', { replace: true });
    }
  }, [generatedPost, navigate]);


  const handlePostToLinkedIn = async () => {
    if (!postId) return;
    setIsPosting(true);
    const formDataObj = new FormData();
    (files || []).forEach(file => {
      formDataObj.append('files', file);
    });
    formDataObj.append('text', editablePost);
    try {
      const response = await fetch(`${API_BASE_URL}/Post_to_linkedin/${postId}?user_id=${userInfo?.linkedin_id}`, {
        method: 'POST',
        body: formDataObj,
      });
      if (response.ok) {
        setPostPublished(true);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Navigate with state to preserve the user session
          navigate('/generate', {
            state: { 
              userInfo,
              currentPage: 'generator' // This ensures we don't show landing page
            }
          });
        }, 3000);
      } else {
        console.error('Failed to post to LinkedIn');
      }
    } catch (error) {
      console.error('Error posting to LinkedIn:', error);
    } finally {
      setIsPosting(false);
    }
  };


  const saveEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="relative min-h-screen">
      
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800" />
      <div className="bg-blue-900/20 backdrop-blur-lg border-b border-blue-500/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">Generated Post</h1>
              {userInfo && (
                <p className="text-blue-200 text-sm">{userInfo.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!generatedPost ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-200">Preparing your post...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Ready to Post</h2>
                  <p className="text-blue-200">Review, edit, and publish</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Editable post block */}
                <div className="bg-white/10 rounded-2xl p-4 border border-blue-500/20">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editablePost}
                        onChange={(e) => setEditablePost(e.target.value)}
                        className="w-full h-40 bg-transparent text-white resize-none focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditablePost(generatedPost);
                            setIsEditing(false);
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-white whitespace-pre-wrap mb-3">{editablePost}</div>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Post
                      </button>
                    </div>
                  )}
                </div>

                {/* Uploaded Images Preview block */}
                {files && files.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-2">Images to be uploaded:</h3>
                    <div className="flex flex-wrap gap-4">
                      {files.map((file, idx) => (
                        <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden border border-blue-500/20">
                          <img
                            src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                            alt={`preview-${idx}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publish button block */}
                <button
                  onClick={handlePostToLinkedIn}
                  disabled={isPosting || isEditing || postPublished}
                  className={`w-full py-4 font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
                    postPublished 
                      ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {postPublished ? (
                    <>
                      <Check className="w-5 h-5" />
                      Published Successfully!
                    </>
                  ) : isPosting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Publish to LinkedIn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success modal block */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-3xl text-center">
            <Check className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Posted Successfully!</h3>
            <p className="text-white/80">Your post is now live on LinkedIn</p>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const navigate = useNavigate(); // Add this line
  const location = useLocation();
  const state = location.state || {};
  
  const [currentPage, setCurrentPage] = useState(state.currentPage || 'landing');
  const [userInfo, setUserInfo] = useState(state.userInfo || null);
  const [isConnected, setIsConnected] = useState(false); // Add this line
  const [formData, setFormData] = useState({
    topic: '',
    structure: '',
    length: 'medium',
    files: []
  });
  const [generatedPost, setGeneratedPost] = useState('');
  const [editablePost, setEditablePost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [postId, setPostId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user is already connected
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinId = urlParams.get('linkedin_id');
    const name = urlParams.get('name');
    
    if (linkedinId && name) {
      setIsConnected(true);
      setUserInfo({ linkedin_id: linkedinId, name: decodeURIComponent(name) });
      setCurrentPage('generator');
    }
  }, []);

  const handleLinkedInConnect = () => {
    window.location.href = `${API_BASE_URL}/auth/linkedin`;
  };

  
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleGeneratePost = async () => {
    if (!formData.topic.trim()) return;
    
    setIsGenerating(true);
    setCurrentStep(4);

    try {
      const response = await fetch(`${API_BASE_URL}/create_post/?user_id=${userInfo?.linkedin_id}&text=${encodeURIComponent(formData.topic)}&length=${formData.length}&note=${encodeURIComponent(formData.structure)}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPost(data.generated_text);
        setEditablePost(data.generated_text);
        setPostId(data.post_id);
        navigate('/generated', {
          state: {
            generatedPost: data.generated_text,
            postId: data.post_id,
            userInfo,
            files: formData.files,
          }
        });
      } else {
        console.error('Failed to generate post');
      }
    } catch (error) {
      console.error('Error generating post:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-40 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="mb-8 animate-bounce">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto transform rotate-12">
              <Linkedin className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Generate
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent"> Viral </span>
            LinkedIn Posts
          </h1>

          <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-3xl leading-relaxed">
            Transform your ideas into engaging LinkedIn content that stops the scroll and drives real engagement
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <button
              onClick={handleLinkedInConnect}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
            >
              <span className="flex items-center gap-3">
                <Linkedin className="w-6 h-6" />
                Connect LinkedIn to Start
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>

          <div className="mt-16 flex items-center gap-8 text-blue-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              <span>Instant Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              <span>Direct Posting</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="bg-blue-900/20 backdrop-blur-lg border-b border-blue-500/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">LinkedIn Post Generator</h1>
              {userInfo && (
                <p className="text-blue-200 text-sm">Welcome back, {userInfo.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  currentStep >= step 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-8 h-0.5 ml-2 transition-all duration-300 ${
                    currentStep > step ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-6xl px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Topic */}
            <div className={`bg-white/5 backdrop-blur-lg rounded-3xl p-8 border transition-all duration-500 ${
              currentStep >= 1 ? 'border-blue-500/30 shadow-lg shadow-blue-500/10' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">What's Your Topic?</h2>
                  <p className="text-blue-200">Tell us what you want to post about</p>
                </div>
              </div>
              <textarea
                value={formData.topic}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, topic: e.target.value }));
                  if (e.target.value.trim() && currentStep === 1) setCurrentStep(2);
                }}
                placeholder="Share your thoughts, experiences, insights, or ask a question..."
                className="w-full h-32 bg-white/10 border border-blue-500/20 rounded-2xl px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-all duration-300"
              />
            </div>

            {/* Structure */}
            <div className={`bg-white/5 backdrop-blur-lg rounded-3xl p-8 border transition-all duration-500 ${
              currentStep >= 2 ? 'border-blue-500/30 shadow-lg shadow-blue-500/10' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Structure & Goal</h2>
                  <p className="text-blue-200">How should we structure your post?</p>
                </div>
              </div>
              <textarea
                value={formData.structure}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, structure: e.target.value }));
                  if (e.target.value.trim() && currentStep === 2) setCurrentStep(3);
                }}
                placeholder="e.g., Hook/Story/Value/CTA format, thought leadership, casual sharing, viral hook..."
                className="w-full h-24 bg-white/10 border border-blue-500/20 rounded-2xl px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-all duration-300 mb-4"
              />
              <div className="grid grid-cols-3 gap-3">
                {['short', 'medium', 'long'].map(length => (
                  <button
                    key={length}
                    onClick={() => setFormData(prev => ({ ...prev, length }))}
                    className={`py-2 px-4 rounded-xl font-medium transition-all duration-300 ${
                      formData.length === length
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-white/10 text-blue-300 hover:bg-white/20'
                    }`}
                  >
                    {length.charAt(0).toUpperCase() + length.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className={`mt-8 bg-white/5 backdrop-blur-lg rounded-3xl p-8 border transition-all duration-500 ${
            currentStep >= 3 ? 'border-blue-500/30 shadow-lg shadow-blue-500/10' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Upload Media</h2>
                <p className="text-blue-200">Add images to make it pop (optional)</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  handleFileUpload(e);
                  if (currentStep === 3) setCurrentStep(4);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="border-2 border-dashed border-blue-500/20 rounded-2xl p-8 text-center hover:border-blue-500/50 transition-all duration-300">
                <Upload className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                <p className="text-blue-300">
                  {formData.files.length > 0 
                    ? `${formData.files.length} file(s) selected`
                    : 'Click or drag images here'
                  }
                </p>
              </div>
            </div>

            {/* Image Previews */}
            {formData.files.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-6">
                {formData.files.map((file, idx) => (
                  <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-blue-500/20">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute bottom-2 right-2 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.topic.trim() && formData.structure.trim() && (
              <button
                onClick={handleGeneratePost}
                disabled={isGenerating}
                className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating Post...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Post
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-10 rounded-3xl text-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-2">Generating your post...</h3>
            <p className="text-white/80">Please wait while we create your LinkedIn post!</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-3xl text-center animate-pulse">
            <Check className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Posted Successfully!</h3>
            <p className="text-white/80">Your post is now live on LinkedIn</p>
          </div>
        </div>
      )}
    </div>
  );
};

const AppWithRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/generate" element={<App />} />
      <Route path="/generated" element={<GeneratedPostPage />} />
    </Routes>
  );
};

export default AppWithRoutes;