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
        let url = "/get_video";
        // Always use device_id for polling
        if (deviceId) {
            url += `?device_id=${encodeURIComponent(deviceId)}`;
        }
        const resp = await fetch(url);
        if (resp.ok) {
            const data = await resp.json();
            console.log('[pollLatestVideo] Backend response:', data); // Debug log
            const videoUrl = data.video_url;
            const title = data.title || '';
            const description = data.description || '';
            if (videoUrl && videoUrl !== lastVideoUrl) {
                lastVideoUrl = videoUrl;
                updateVideoSection(videoUrl, title, description);
                return true; // Stop polling
            } else if (videoUrl) {
                updateVideoSection(videoUrl, title, description);
            }
        } else {
            updateVideoSection(null);
        }
    } catch {
        updateVideoSection(null);
    }
    return false;
}



// Form submission

let requestedVideoId = null;
// Device ID logic
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}
const deviceId = getDeviceId();

document.getElementById("mainForm").addEventListener("submit", async (e) => {
    // Set flag in localStorage to indicate video generation in progress
    localStorage.setItem('video_generation_in_progress', 'true');
    e.preventDefault();

    const formData = {
        mainTopic: e.target.mainTopic.value,
        duration: e.target.duration.value,
        videoType: e.target.videoType.value,
        ttsVoice: e.target.ttsVoice.value,
        device_id: deviceId,
    };

    const response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });

    const result = await response.json();
    const resultMsg = document.getElementById("result");
    resultMsg.innerText = "";

    // Save the video id returned by backend
    requestedVideoId = result.video_id;

    // Start polling for the requested device's video after submission
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(async () => {
        const found = await pollLatestVideo();
        if (found) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
            // Clear the in-progress flag when video is ready
            localStorage.removeItem('video_generation_in_progress');
        }
    }, 5000);
});


// Only poll after form submission
let pollIntervalId = null;

// On page load, poll for device's video if deviceId exists (otherwise show blank)
window.addEventListener("DOMContentLoaded", async () => {
    if (deviceId) {
        const found = await pollLatestVideo();
        // If no video, section stays blank
        // If a video generation is in progress, resume polling
        if (localStorage.getItem('video_generation_in_progress') === 'true') {
            if (pollIntervalId) clearInterval(pollIntervalId);
            pollIntervalId = setInterval(async () => {
                const found = await pollLatestVideo();
                if (found) {
                    clearInterval(pollIntervalId);
                    pollIntervalId = null;
                    localStorage.removeItem('video_generation_in_progress');
                }
            }, 5000);
        }
    }
});