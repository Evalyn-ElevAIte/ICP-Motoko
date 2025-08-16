import { html, render } from 'lit-html';
import { evalyn_icp_backend } from 'declarations/evalyn_icp_backend';

class App {
  greeting = '';
  uploadResult = '';
  analysisResult = '';
  uploadLoading = false;
  resultLoading = false;

  constructor() {
    this.#render();
  }

  #uploadVideo = async () => {
    const fileInput = document.getElementById('videoFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const loading = document.getElementById('uploadLoading');
    const result = document.getElementById('uploadResult');

    if (!fileInput.files[0]) {
      this.#showError('uploadResult', 'Please select a video file first!');
      return;
    }

    const file = fileInput.files[0];

    // Check file size (limit to 50MB for demo)
    if (file.size > 50 * 1024 * 1024) {
      this.#showError('uploadResult', 'File too large! Please select a video under 50MB.');
      return;
    }

    try {
      uploadBtn.disabled = true;
      this.uploadLoading = true;
      this.uploadResult = '';
      this.#render();

      // Convert file to ArrayBuffer then to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Call backend
      const response = await evalyn_icp_backend.analyzeVideo(uint8Array);

      this.uploadLoading = false;
      uploadBtn.disabled = false;

      const resultText = `✅ Upload Successful!

Video ID: ${response.videoId}
Status: ${response.status}
File: ${file.name}
Size: ${(file.size / 1024 / 1024).toFixed(2)} MB

💡 Copy the Video ID above and use it in the "Check Results" section below to see your analysis results!`;

      this.#showSuccess('uploadResult', resultText);
      this.uploadResult = resultText;

      // Auto-fill the video ID in the check section
      document.getElementById('videoId').value = response.videoId;

    } catch (error) {
      this.uploadLoading = false;
      uploadBtn.disabled = false;
      this.#showError('uploadResult', `Upload failed: ${error.message}`);
      this.uploadResult = `Upload failed: ${error.message}`;
    }
  };

  #checkResults = async () => {
    const videoIdInput = document.getElementById('videoId');
    const loading = document.getElementById('resultLoading');
    const result = document.getElementById('analysisResult');

    if (!videoIdInput.value.trim()) {
      this.#showError('analysisResult', 'Please enter a Video ID!');
      return;
    }

    try {
      this.resultLoading = true;
      this.analysisResult = '';
      this.#render();

      const response = await evalyn_icp_backend.getAnalysisResult(videoIdInput.value.trim());

      this.resultLoading = false;

      if (!response) {
        this.#showError('analysisResult', 'Video ID not found! Please check the ID and try again.');
        this.analysisResult = 'Video ID not found! Please check the ID and try again.';
        return;
      }

      const analysis = response[0]; // response is an optional, so we get the first element
      let statusClass = `status-${analysis.status}`;

      let resultText = `📊 Analysis Results

Video ID: ${analysis.videoId}
Status: ${analysis.status.toUpperCase()}
Timestamp: ${new Date(Number(analysis.timestamp) / 1000000).toLocaleString()}

`;

      if (analysis.status === 'completed' && analysis.aiResponse && analysis.aiResponse[0]) {
        const aiData = JSON.parse(analysis.aiResponse[0]);
        resultText += `🎯 AI Analysis Results:

📈 GRADING:
• Overall Score: ${aiData.grading.overall_score}/100
• Creativity: ${aiData.grading.creativity}/100  
• Clarity: ${aiData.grading.clarity}/100

📝 SUMMARY:
${aiData.summary}

🎭 PERFORMANCE METRICS:
• Confidence: ${aiData.performance.confidence}/100
• Engagement: ${aiData.performance.engagement}/100
• Time Management: ${aiData.performance.time_management}/100`;
      } else if (analysis.status === 'pending') {
        resultText += '⏳ Your video is queued for processing. Please check back in a few moments.';
      } else if (analysis.status === 'processing') {
        resultText += '🔄 AI is currently analyzing your video. This may take a few minutes.';
      } else if (analysis.status === 'failed') {
        resultText += '❌ Analysis failed. Please try uploading the video again.';
      }

      this.analysisResult = `<div class="${statusClass}">${resultText}</div>`;

    } catch (error) {
      this.resultLoading = false;
      this.#showError('analysisResult', `Error checking results: ${error.message}`);
      this.analysisResult = `Error checking results: ${error.message}`;
    }
  };

  #showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="success-message">${message}</div>`;
    element.style.display = 'block';
  }

  #showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="error-message">${message}</div>`;
    element.style.display = 'block';
  }

  #render() {
    let body = html`
      <div class="container">
        <div class="header">
          <h1>EVALYN</h1>
          <p>AI-Powered Video Analysis Platform</p>
        </div>

        <div class="content">
          <!-- Upload Section -->
          <div class="section">
            <h2>Upload & Analyze Video</h2>
            <div class="input-group">
              <label for="videoFile">Select Video File (MP4, MOV, AVI)</label>
              <input type="file" id="videoFile" class="file-input" accept="video/*">
            </div>
            <button @click=${this.#uploadVideo} class="btn" id="uploadBtn">
              Analyze Video
            </button>

            <div class="loading" id="uploadLoading" style="display: ${this.uploadLoading ? 'block' : 'none'}">
              <div class="spinner"></div>
              <p>Uploading and processing video...</p>
            </div>

            <div id="uploadResult" class="result-box" style="display: ${this.uploadResult ? 'block' : 'none'}">${this.uploadResult}</div>
          </div>

          <!-- Check Results Section -->
          <div class="section">
            <h2>Check Analysis Results</h2>
            <div class="input-group">
              <label for="videoId">Video ID</label>
              <input type="text" id="videoId" placeholder="vid_1234567890...">
            </div>
            <button @click=${this.#checkResults} class="btn">
              Get Results
            </button>

            <div class="loading" id="resultLoading" style="display: ${this.resultLoading ? 'block' : 'none'}">
              <div class="spinner"></div>
              <p>Fetching results...</p>
            </div>

            <div id="analysisResult" class="result-box" style="display: ${this.analysisResult ? 'block' : 'none'}">${this.analysisResult}</div>
          </div>
        </div>
      </div>
    `;
    render(body, document.getElementById('root'));
  }
}

export default App;
