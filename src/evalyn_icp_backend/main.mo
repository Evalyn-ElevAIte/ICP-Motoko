import HashMap = "mo:base/HashMap";
import Text = "mo:base/Text";
import Time = "mo:base/Time";
import Int = "mo:base/Int";
import Random = "mo:base/Random";
import Blob = "mo:base/Blob";
import Array = "mo:base/Array";
import Iter = "mo:base/Iter";

actor {
  
  // Data type for video analysis results
  public type VideoAnalysis = {
    videoId: Text;
    status: Text; // "pending", "processing", "completed", "failed"
    timestamp: Int;
    aiResponse: ?Text; // Optional, null until AI responds
    retryCount: Nat;
  };

  // Stable storage for video analysis
  private stable var videoEntries : [(Text, VideoAnalysis)] = [];
  private var videoStorage = HashMap.HashMap<Text, VideoAnalysis>(0, Text.equal, Text.hash);

  // System functions for data persistence
  system func preupgrade() {
    videoEntries := Iter.toArray(videoStorage.entries());
  };

  system func postupgrade() {
    videoEntries := [];
  };

  // Initialize storage from stable memory
  private func initStorage() {
    for ((key, value) in videoEntries.vals()) {
      videoStorage.put(key, value);
    };
  };

  // Generate unique video ID
  private func generateVideoId() : Text {
    let timestamp = Int.abs(Time.now());
    "vid_" # Int.toText(timestamp);
  };

  // Mock AI agent call (replace with real API later)
  private func callAIAgent(videoBlob: Blob) : async Text {
    // Simulate AI processing time and return mock response
    "{\"grading\": {\"overall_score\": 85, \"creativity\": 90, \"clarity\": 80}, \"summary\": \"Great presentation with excellent creativity and clear delivery. Could improve on technical accuracy.\", \"performance\": {\"confidence\": 85, \"engagement\": 90, \"time_management\": 75}}";
  };

  // Test functions
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };

  public query func getWelcomeMessage() : async Text {
    return "Welcome to EVALYN! Your AI-powered video and text scoring platform.";
  };

  // POST endpoint: Upload and analyze video
  public func analyzeVideo(videoData: Blob) : async {videoId: Text; status: Text} {
    // Initialize storage if needed
    initStorage();
    
    // Generate unique video ID
    let videoId = generateVideoId();
    
    // Create initial record with pending status
    let analysis : VideoAnalysis = {
      videoId = videoId;
      status = "pending";
      timestamp = Time.now();
      aiResponse = null;
      retryCount = 0;
    };
    
    // Store initial record
    videoStorage.put(videoId, analysis);
    
    // Start AI processing (in background)
    ignore async {
      try {
        // Update status to processing
        let processingAnalysis = {
          videoId = videoId;
          status = "processing";
          timestamp = analysis.timestamp;
          aiResponse = null;
          retryCount = 0;
        };
        videoStorage.put(videoId, processingAnalysis);
        
        // Call AI agent
        let aiResponse = await callAIAgent(videoData);
        
        // Update with completed results
        let completedAnalysis = {
          videoId = videoId;
          status = "completed";
          timestamp = analysis.timestamp;
          aiResponse = ?aiResponse;
          retryCount = 0;
        };
        videoStorage.put(videoId, completedAnalysis);
        
      } catch (error) {
        // Handle AI agent failure
        let failedAnalysis = {
          videoId = videoId;
          status = "failed";
          timestamp = analysis.timestamp;
          aiResponse = null;
          retryCount = 1;
        };
        videoStorage.put(videoId, failedAnalysis);
      };
    };
    
    // Return video ID immediately
    return {videoId = videoId; status = "pending"};
  };

  // GET endpoint: Retrieve analysis results
  public query func getAnalysisResult(videoId: Text) : async ?{
    videoId: Text;
    status: Text;
    timestamp: Int;
    aiResponse: ?Text;
  } {
    // Initialize storage if needed
    initStorage();
    
    switch (videoStorage.get(videoId)) {
      case null { null };
      case (?analysis) {
        ?{
          videoId = analysis.videoId;
          status = analysis.status;
          timestamp = analysis.timestamp;
          aiResponse = analysis.aiResponse;
        }
      };
    };
  };

  // Helper endpoint: Get all video IDs (for testing)
  public query func getAllVideoIds() : async [Text] {
    initStorage();
    let keys = Iter.toArray(videoStorage.keys());
    keys;
  };

}