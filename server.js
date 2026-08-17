import express from 'express';
import multer from 'multer';
import { FoundryLocalManager } from 'foundry-local-sdk';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

let chatClient = null;
let isInitializing = false;
let initStatus = 'Not started';

// Initialize SDK and Load Model
async function initFoundry() {
    if (chatClient) return;
    isInitializing = true;
    
    initStatus = 'Initializing SDK...';
    const manager = FoundryLocalManager.create({
        appName: 'foundry_local_samples',
        logLevel: 'info'
    });

    initStatus = 'Downloading execution providers...';
    await manager.downloadAndRegisterEps((epName, percent) => {
        initStatus = `EP [${epName}]: ${percent.toFixed(1)}%`;
    });

    initStatus = 'Fetching model...';
    const model = await manager.catalog.getModel('qwen2.5-0.5b');

    await model.download((progress) => {
        initStatus = `Downloading model: ${progress.toFixed(1)}%`;
    });

    initStatus = 'Loading model into memory...';
    await model.load();

    chatClient = model.createChatClient();
    initStatus = 'Ready';
    isInitializing = false;
}

// Endpoint: Check Initialization Status
app.get('/api/status', (req, res) => {
    res.json({ status: initStatus, ready: !!chatClient, loading: isInitializing });
});

// Endpoint: Trigger Model Loading
app.post('/api/init', async (req, res) => {
    if (!chatClient && !isInitializing) {
        initFoundry().catch(err => {
            initStatus = `Error: ${err.message}`;
            isInitializing = false;
        });
    }
    res.json({ status: initStatus });
});

// Endpoint: Summarize Direct Text or File Uploads
app.post('/api/summarize', upload.array('files'), async (req, res) => {
    if (!chatClient) {
        return res.status(503).json({ error: 'Model is not loaded yet.' });
    }

    const systemPrompt = req.body.systemPrompt || 
        'Summarize the following document into concise bullet points. Focus on the key points and main ideas. Limit to 1000 characters and below.';

    let inputs = [];

    // Text input from UI
    if (req.body.textInput && req.body.textInput.trim() !== '') {
        inputs.push({ name: 'Direct Input', content: req.body.textInput });
    }

    // Uploaded files
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            inputs.push({ name: file.originalname, content: file.buffer.toString('utf-8') });
        }
    }

    if (inputs.length === 0) {
        return res.status(400).json({ error: 'Please provide text or upload a file.' });
    }

    const results = [];
    for (const item of inputs) {
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: item.content }
        ];

        try {
            const response = await chatClient.completeChat(messages);
            results.push({
                filename: item.name,
                summary: response.choices[0]?.message?.content || 'No summary generated.'
            });
        } catch (err) {
            results.push({ filename: item.name, error: err.message });
        }
    }

    res.json({ results });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));