const express = require('express');
const serverless = require('serverless-http');
const { GoogleGenAI } = require('@google/genai');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Firebase with environment variables
if (!admin.apps.length) {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    const serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

const db = admin.firestore();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Mock AI endpoint for testing
app.post('/api/ai/assess', async (req, res) => {
  try {
    const { responses } = req.body;
    
    // Mock assessment response
    const assessment = {
      overallScore: 85,
      skillAssessments: [
        {
          skill: 'Communication',
          category: 'soft',
          level: 90,
          confidence: 0.95,
          evidence: ['Clear articulation', 'Good structure'],
          gaps: ['Could add more specific examples'],
          recommendations: ['Practice with STAR method'],
          benchmarkComparison: {
            industryAverage: 75,
            topPerformers: 92,
            percentile: 85
          }
        }
      ],
      strengths: ['Strong communication skills', 'Good problem-solving'],
      weaknesses: ['Needs more specific examples'],
      careerFit: {
        matchingRoles: ['Software Engineer', 'Full Stack Developer'],
        readiness: 85,
        marketability: 80
      },
      predictions: {
        performancePotential: 90,
        learningCurve: 'fast',
        successProbability: 0.85,
        timeToProficiency: 6
      },
      personalizedPlan: {
        shortTerm: ['Practice behavioral questions', 'Improve technical depth'],
        longTerm: ['Develop leadership skills', 'Learn cloud technologies']
      }
    };
    
    res.json(assessment);
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({ error: 'Assessment failed' });
  }
});

// Mock session endpoint
app.post('/api/sessions', async (req, res) => {
  try {
    const sessionData = req.body;
    const sessionRef = await db.collection('sessions').add({
      ...sessionData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    
    res.json({ 
      success: true, 
      sessionId: sessionRef.id,
      message: 'Session created successfully' 
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Mock user endpoints
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    const userRef = await db.collection('users').add({
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    
    res.json({ 
      success: true, 
      userId: userRef.id,
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Analytics endpoint
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const analyticsSnapshot = await db.collection('analytics')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const analytics = analyticsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export the serverless function
module.exports.handler = serverless(app);
