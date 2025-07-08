let lastVideoUrl = null;

function updateVideoSection(videoUrl, title = '', description = '') {
    const videoSection = document.getElementById("videoSection");
    const videoPlayer = document.getElementById("videoPlayer");
    const downloadBtn = document.getElementById("downloadBtn");
    const videoTitle = document.getElementById("videoTitle");
    const videoDescription = document.getElementById("videoDescription");
    let loaderContainer = document.getElementById("videoLoaderContainer");
    let loading = document.getElementById("videoLoading");
    let loadingMsg = document.getElementById("videoLoadingMsg");

    if (!videoSection) return;
    videoSection.style.display = "block";

    if (!loaderContainer) {
        loaderContainer = document.createElement("div");
        loaderContainer.id = "videoLoaderContainer";
        loaderContainer.className = "loader-container d-flex justify-content-center align-items-center";
        loaderContainer.style.height = "100%";
        loading = document.createElement("div");
        loading.id = "videoLoading";
        loading.className = "loader";
        loadingMsg = document.createElement("div");
        loadingMsg.id = "videoLoadingMsg";
        loadingMsg.className = "loader-message";
        loadingMsg.innerText = "Please wait for a moment...";
        loaderContainer.appendChild(loading);
        loaderContainer.appendChild(loadingMsg);
        videoSection.insertBefore(loaderContainer, videoPlayer);
    }

    if (videoUrl) {
        videoPlayer.src = videoUrl;
        videoPlayer.style.display = "block";
        downloadBtn.href = videoUrl;
        downloadBtn.download = "completed_video.mp4";
        downloadBtn.style.display = "inline-block";
        loaderContainer.style.display = "none";
        if (videoTitle) videoTitle.textContent = title || '';
        if (videoDescription) videoDescription.textContent = description || '';
    } else {
        loaderContainer.style.display = "flex";
        if (loadingMsg) loadingMsg.innerText = "Please wait for a moment...";
        videoPlayer.style.display = "none";
        downloadBtn.style.display = "none";
        if (videoTitle) videoTitle.textContent = '';
        if (videoDescription) videoDescription.textContent = '';
    }
}


async function pollLatestVideo() {
    try {
        const resp = await fetch("/get_video");
        if (resp.ok) {
            const data = await resp.json();
            const videoUrl = data.video_url;
            const title = data.title || '';
            const description = data.description || '';
            const status = (data.status || '').toLowerCase();
            const videoId = data.video_id || null;
            const mainContent = document.getElementById('mainContent');
            const loadingContainer = document.getElementById('loadingContainer');
            const loadingMsg = document.getElementById('videoLoadingMsg');
            let warnDiv = document.getElementById('processingWarning');
            if (!warnDiv) {
                warnDiv = document.createElement('div');
                warnDiv.id = 'processingWarning';
                warnDiv.style.color = '#d97706';
                warnDiv.style.fontWeight = 'bold';
                warnDiv.style.marginTop = '1.25rem';
                if (loadingContainer) loadingContainer.appendChild(warnDiv);
            }

            // If a new video is being processed, or status is processing, show loading for all users
            if (status && status !== 'ready' && status !== 'done') {
                // Only reload once per processing event using sessionStorage
                if (!sessionStorage.getItem('hasReloadedForProcessing')) {
                    sessionStorage.setItem('hasReloadedForProcessing', 'true');
                    location.reload();
                    return;
                }
                // Always force mainContent and videoSection hidden, loadingContainer shown during processing
                if (mainContent) mainContent.style.display = 'none';
                if (loadingContainer) loadingContainer.style.display = 'block';
                const videoSection = document.getElementById('videoSection');
                if (videoSection) videoSection.style.display = 'none';
                if (loadingMsg) loadingMsg.innerText = 'Generating a video, please wait for a moment...';
                lastVideoId = videoId;
                lastStatus = status;
                return;
            }

            // If new completed video appears, show it
            if (videoUrl && (videoId !== lastVideoId || status !== lastStatus)) {
                // Remove reload flag when video is ready
                sessionStorage.removeItem('hasReloadedForProcessing');
                lastVideoId = videoId;
                lastStatus = status;
                lastVideoUrl = videoUrl;
                updateVideoSection(videoUrl, title, description);
                if (mainContent) mainContent.style.display = 'block';
                if (loadingContainer) loadingContainer.style.display = 'none';
                const videoSection = document.getElementById('videoSection');
                if (videoSection) videoSection.style.display = 'block';
                warnDiv.innerText = '';
                warnDiv.style.display = 'none';
                return;
            }
            // If video is ready, keep showing it
            if (videoUrl && status === 'ready') {
                // Remove reload flag when video is ready
                sessionStorage.removeItem('hasReloadedForProcessing');
                updateVideoSection(videoUrl, title, description);
                if (mainContent) mainContent.style.display = 'block';
                if (loadingContainer) loadingContainer.style.display = 'none';
                const videoSection = document.getElementById('videoSection');
                if (videoSection) videoSection.style.display = 'block';
                warnDiv.innerText = '';
                warnDiv.style.display = 'none';
                return;
            }
        } else {
            updateVideoSection(null);
        }
    } catch {
        updateVideoSection(null);
    }
}


// Form submission

document.getElementById("mainForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Hide main content and show loading container
    const mainContent = document.getElementById('mainContent');
    const loadingContainer = document.getElementById('loadingContainer');
    if (mainContent) mainContent.style.display = 'none';
    if (loadingContainer) loadingContainer.style.display = 'block';
    // Hide and reset video section content
    const videoPlayer = document.getElementById('videoPlayer');
    const downloadBtn = document.getElementById('downloadBtn');
    const videoMeta = document.getElementById('videoMeta');
    if (videoPlayer) {
        videoPlayer.style.display = 'none';
        videoPlayer.src = '';
    }
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (videoMeta) {
        const videoTitle = document.getElementById('videoTitle');
        const videoDescription = document.getElementById('videoDescription');
        if (videoTitle) videoTitle.textContent = '';
        if (videoDescription) videoDescription.textContent = '';
    }
    // Show loader message
    let loadingMsg = document.getElementById("videoLoadingMsg");
    if (loadingMsg) loadingMsg.innerText = "Please wait for a moment...";

    const formData = {
        mainTopic: e.target.mainTopic.value,
        duration: e.target.duration.value,
        videoType: e.target.videoType.value,
        ttsVoice: e.target.ttsVoice.value,
        aspectRatio: e.target.aspectRatio.value,
        bgMusic: e.target.bgMusic.value,
    };

    const response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });

    const result = await response.json();
    const resultMsg = document.getElementById("result");
    resultMsg.innerText = "";

    // Start polling for the latest video after submission
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(async () => {
        const found = await pollLatestVideo();
        if (found) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
    }, 1000);
});

// Only poll after form submission
let pollIntervalId = null;
let lastVideoId = null;
let lastStatus = null;

window.addEventListener("DOMContentLoaded", async () => {
    const mainContent = document.getElementById('mainContent');
    const loadingContainer = document.getElementById('loadingContainer');
    if (mainContent) mainContent.style.display = 'none';
    if (loadingContainer) loadingContainer.style.display = 'block';
    // Always poll every second, for all users
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(async () => {
        await pollLatestVideo();
    }, 1000);
    // Do one immediate fetch
    await pollLatestVideo();
});