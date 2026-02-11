require('dotenv').config();

async function listModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return;
    }
    
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    
    console.log('Fetching available models from Google Generative AI API...\n');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Available Models:');
    console.log('=================\n');
    
    if (data.models) {
      data.models.forEach((model) => {
        console.log(`Model: ${model.name}`);
        console.log(`Display Name: ${model.displayName}`);
        console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log(`Input Token Limit: ${model.inputTokenLimit}`);
        console.log(`Output Token Limit: ${model.outputTokenLimit}`);
        console.log('---\n');
      });
      
      console.log('\n\nModels Supporting generateContent:');
      console.log('====================================\n');
      
      data.models.forEach((model) => {
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          const modelVersion = model.name.split('/')[1];
          console.log(`✓ ${modelVersion}`);
        }
      });
    } else {
      console.log('No models found in response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();
