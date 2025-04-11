const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");



const API_KEY = "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"; //Hugging face API key

const examplePrompts = [
    "A futuristic cityscape at sunset, with flying cars and neon lights, in cyberpunk style",
    "A peaceful forest with a small wooden cabin and a gentle river flowing nearby, in a watercolor painting style",
    "A cute cat wearing a wizard hat and reading a magical book, cartoon style",
    "An astronaut standing on the surface of Mars, looking at Earth in the sky, ultra-realistic",
    "A traditional Japanese tea house surrounded by cherry blossom trees during spring",
    "A dragon flying over a medieval castle at night with a full moon in the background",
    "A surreal landscape with floating islands and giant mushrooms, dreamy and colorful",
    "A delicious plate of sushi on a wooden table, photorealistic food photography style",
    "A retro 1980s-style arcade with neon signs, pixel art, and vintage game machines",
    "A majestic lion wearing a royal crown, oil painting style with dramatic lighting",
];

// Set theme based on saved preference or system default
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-schene: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();


// Switch between light and dark themes
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Calculate width/height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    //Ensure dimensions are multiples of 16 (AI model requirements)
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
};

const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" class="result-img" />
                        <div class="img-overlay">
                            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>`;
}

// Send request to Hugging Face API to create image
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled", "true");

    // Create an array of image generation promises
    const imagePromises = Array.from({length: imageCount}, async(_, i) => {
        // Send request to the AI model API
        try {
            const response = await fetch(MODEL_URL, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: {width, height},
                }),
            });

            if (!response.ok) throw new Error((await response.json())?.error);
    
            const result = await response.blob();
            updateImageCard(i, URL.createObjectURL(result));
        } catch (error) {
            console.log(error);
            const imgCard = document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading", "error");
            imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for more details.";
        }
    });

    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled");

};

// Create placeholder cards with loading spinners
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = "";

    for (let i =0; i < imageCount; i++) {
        gridGallery.innerHTML += ` <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
                        <div class="status-container">
                            <div class="spinner"></div>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p class="status-text">Generating...</p>
                        </div>
                    </div>`;
    }

    generateImages(selectedModel, imageCount, aspectRatio, promptText);
}

// Handle form submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    // Get form values
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
}

// Fill prompt input with random example
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});


promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
