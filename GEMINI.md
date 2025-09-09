# GEMINI.md: Technical Overview

## 1. Introduction

This document provides a technical overview of the UGC Script Splitter for Veo 3 project. It is intended for developers who will be working on the codebase.

## 2. Project Structure

The project is a monorepo with a Node.js backend and a React frontend.

*   **`/api`**: Contains the backend Express.js application.
    *   **`/api/routes`**: Defines the API endpoints.
    *   **`/api/services`**: Contains the business logic for interacting with AI services.
*   **`/client`**: Contains the frontend React application.
    *   **`/client/src/api`**: Contains client-side functions for making API calls.
    *   **`/client/src/components`**: Contains the React components.
*   **`/instructions`**: Contains markdown files with detailed instructions for the AI models.
*   **`/runs`**: Contains the inputs and outputs of previous generation runs (for the "Plus" mode).

## 3. Backend

### 3.1. `server.js`

The main entry point for the backend server. It sets up the Express.js application, middleware, and routes.

### 3.2. API Routes

The API routes are defined in the `/api/routes` directory. There are four main route files:

*   **`generate.js`**: Handles the standard generation mode. It has endpoints for generating segments, downloading segments, and generating video descriptions.
*   **`generate.plus.js`**: Handles the "Standard Plus" mode. It has similar endpoints to `generate.js`, but it uses `OpenAIServicePlus` and persists the results to the `/runs` directory.
*   **`generateContinuation.js`**: Handles the "Continuation Mode", which allows for generating a single segment at a time.
*   **`generate.newcont.js`**: Handles the "New Continuation Mode", which is similar to the standard continuation mode but with support for animal avatars.

### 3.3. AI Services

The business logic for interacting with AI services is located in the `/api/services` directory.

*   **`openaiService.js`**: The core of the application. It is responsible for:
    *   Splitting the script into 8-second segments.
    *   Generating base descriptions for character, clothing, and environment.
    *   Generating the full JSON for each segment.
    *   Handling the "Continuation Mode" by generating a voice profile and using it to generate subsequent segments.
*   **`openaiService.plus.js`**: An enhanced version of `OpenAIService`. It has several new features, including:
    *   AI-powered location and camera style inference.
    *   Plausibility sanitization to fix impossible scenarios.
    *   More detailed prompts with additional guardrails.
*   **`veo3Service.js`**: Responsible for interacting with Google's AI services (Gemini and Vertex AI) to generate video descriptions.

## 4. Frontend

### 4.1. `App.js`

The main component of the React application. It manages the application state and renders the different components based on the active tab.

### 4.2. Components

The UI is built with a set of React components, including:

*   **`ScriptForm` / `ScriptFormPlus`**: The forms for submitting the script and generation parameters.
*   **`ResultsDisplay` / `ResultsDisplayPlus`**: The components for displaying the generated segments.
*   **`DownloadButton` / `DownloadButtonPlus`**: The buttons for downloading the segments as a ZIP file.
*   **`VideoGenerator` / `VideoGeneratorPlus`**: The components for generating video descriptions.
*   **`ContinuationMode` / `NewContinuationMode`**: The components for the continuation modes.
*   **`SegmentManager`**: A component for editing and managing the generated segments.
*   **`BulkOperations`**: A component for performing find and replace operations on the segments.

## 5. Key Concepts

### 5.1. JSON Formats

The application uses two detailed JSON formats for video generation: "Standard" and "Enhanced Continuity". The specifications for these formats are defined in the markdown files in the `/instructions` directory.

### 5.2. Continuation Mode

The "Continuation Mode" is a key feature of the application. It works by first generating a detailed first segment and then extracting a "voice profile" from it. This voice profile is then used to generate the subsequent segments, ensuring a high level of consistency in the character's voice and behavior.

### 5.3. AI-Powered Inference

The "Standard Plus" mode uses AI to infer the best locations and camera styles for the video based on the script. This is a powerful feature that can save the user a lot of time and effort.
