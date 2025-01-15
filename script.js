async function shortenUrl() {
  const urlInput = document.getElementById("urlInput");
  const customName = document.getElementById("customName");
  const shortUrlElement = document.getElementById("shortUrl");
  const resultDiv = document.getElementById("result");
  const shortenBtn = document.getElementById("shortenBtn");
  const btnText = document.getElementById("btnText");
  const btnLoading = document.getElementById("btnLoading");

  if (!urlInput.value) {
    shake(urlInput);
    return;
  }

  // Show loading state
  shortenBtn.disabled = true;
  btnText.classList.add("scale-0");
  btnLoading.classList.remove("scale-0");
  resultDiv.classList.add("hidden");

  try {
    // Artificial delay for better UX (remove in production)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: urlInput.value,
        custom_name: customName.value,
      }),
    });

    const data = await response.json();

    if (data.success) {
      const shortUrl = `${window.location.origin}/${data.short_url}`;
      shortUrlElement.textContent = shortUrl;
      resultDiv.classList.remove("hidden");
      resultDiv.classList.add("animate__fadeInUp");
    } else {
      showError(data.error);
    }
  } catch (error) {
    showError("Could not create short URL");
  } finally {
    // Reset button state
    shortenBtn.disabled = false;
    btnText.classList.remove("scale-0");
    btnLoading.classList.add("scale-0");
  }
}

function copyToClipboard() {
  const shortUrl = document.getElementById("shortUrl").textContent;
  const copyBtn = document.getElementById("copyBtn");

  navigator.clipboard
    .writeText(shortUrl)
    .then(() => {
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = `
            <span class="material-icons">check_circle</span>
            <span>Copied!</span>
        `;
      copyBtn.classList.remove("bg-gray-800", "hover:bg-gray-900");
      copyBtn.classList.add("bg-green-600", "hover:bg-green-700");

      showToast("URL copied to clipboard!", "check_circle");

      setTimeout(() => {
        copyBtn.innerHTML = originalHtml;
        copyBtn.classList.add("bg-gray-800", "hover:bg-gray-900");
        copyBtn.classList.remove("bg-green-600", "hover:bg-green-700");
      }, 2000);
    })
    .catch(() => {
      showToast("Failed to copy URL", "error");
    });
}

function showError(message) {
  showToast(message, "error");
  const shortUrlElement = document.getElementById("shortUrl");
  const resultDiv = document.getElementById("result");

  shortUrlElement.textContent = `Error: ${message}`;
  shortUrlElement.classList.add("text-red-600");
  resultDiv.classList.remove("hidden");
  resultDiv.classList.add("animate__fadeInUp");

  setTimeout(() => {
    resultDiv.classList.add("animate__fadeOut");
    setTimeout(() => {
      resultDiv.classList.add("hidden");
      resultDiv.classList.remove("animate__fadeOut");
      shortUrlElement.classList.remove("text-red-600");
    }, 500);
  }, 3000);
}

function showToast(message, icon = "check_circle") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const iconElement = toast.querySelector(".material-icons");

  // Set appropriate color for different states
  const iconColors = {
    check_circle: "text-green-400",
    error: "text-red-400",
    content_paste: "text-blue-400",
  };

  // Remove all possible color classes
  iconElement.classList.remove(
    "text-green-400",
    "text-red-400",
    "text-blue-400"
  );
  // Add appropriate color class
  iconElement.classList.add(iconColors[icon] || "text-green-400");

  iconElement.textContent = icon;
  toastMessage.textContent = message;

  toast.classList.remove("translate-y-full", "opacity-0");

  setTimeout(() => {
    toast.classList.add("translate-y-full", "opacity-0");
  }, 3000);
}

function shake(element) {
  element.classList.add("animate__animated", "animate__shakeX");
  element.addEventListener("animationend", () => {
    element.classList.remove("animate__animated", "animate__shakeX");
  });
}

// Add this new function after existing functions
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const urlInput = document.getElementById("urlInput");
    urlInput.value = text;

    // Validate URL format
    try {
      new URL(text);
      // If URL is valid, add success indication
      urlInput.classList.add("border-green-500");
      showToast("URL pasted successfully!", "content_paste");
      setTimeout(() => {
        urlInput.classList.remove("border-green-500");
      }, 2000);
    } catch {
      // If URL is invalid, add error indication
      urlInput.classList.add("border-red-500");
      showToast("Invalid URL format", "error");
      setTimeout(() => {
        urlInput.classList.remove("border-red-500");
      }, 2000);
    }
  } catch (err) {
    showToast("Failed to paste from clipboard", "error");
  }
}
