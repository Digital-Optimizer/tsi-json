# Product Requirements Document: UGC Script Splitter for Veo 3

## 1. Overview

The UGC Script Splitter for Veo 3 is a web-based tool designed to help content creators, marketers, and video producers transform user-generated content (UGC) scripts into AI-ready video segments. The tool automates the process of splitting long scripts into smaller, manageable chunks and generating detailed JSON descriptions for each segment. These JSON files can then be used with AI video generation platforms like Google's Veo 3 to create high-quality, consistent videos.

## 2. Target Audience

*   **Content Creators:** Individuals and teams creating UGC-style videos for social media platforms like TikTok, Instagram, and YouTube.
*   **Marketing Agencies:** Agencies producing video ads for clients.
*   **Small Businesses:** Businesses using video marketing to promote their products and services.

## 3. Key Features

### 3.1. Script Splitting

*   **Automatic Segmentation:** The tool automatically splits a user-provided script into 8-second segments.
*   **Intelligent Splitting:** The script splitting algorithm is designed to create natural breaks in the dialogue, ensuring that each segment is a coherent thought or sentence.

### 3.2. JSON Generation

*   **Two JSON Formats:** The tool supports two JSON formats for video generation:
    *   **Standard:** A detailed format with over 300 words of description per segment, covering character, clothing, environment, and actions.
    *   **Enhanced Continuity:** A more advanced format with over 500 words of description per segment, including new fields for micro-expressions, breathing rhythm, and continuity markers to ensure seamless transitions between segments.
*   **Customizable Generation:** Users can customize the generation process by providing details about the character (age, gender, ethnicity), clothing, room style, and other parameters.

### 3.3. Video Generation

*   **Video Description Generation:** The tool integrates with Google's Gemini and Vertex AI to generate detailed video descriptions for each segment.
*   **Kie.ai Integration:** The tool integrates with Kie.ai for actual video generation, providing a cost-effective alternative to the official Veo 3 API.

### 3.4. Workflow and UI

*   **Tab-Based Interface:** The application features a user-friendly tab-based interface that allows users to switch between different generation modes.
*   **Segment Management:** Users can view, edit, and manage the generated segments in a dedicated segment manager.
*   **Bulk Operations:** A "Find & Replace" feature allows users to make bulk edits to the generated segments.
*   **Bulk Export:** Users can download all the generated segments as a single ZIP file.

## 4. Technical Requirements

### 4.1. Backend

*   **Framework:** Node.js with Express.js
*   **API:** A RESTful API with endpoints for generating segments, downloading segments, and generating videos.
*   **AI Services:** Integration with OpenAI for JSON generation, and Google Gemini/Vertex AI for video description generation.

### 4.2. Frontend

*   **Framework:** React
*   **UI:** A responsive and intuitive user interface with a tab-based layout.
*   **API Client:** A client-side API module for communicating with the backend.

## 5. Future Features

*   **Direct Veo 3 Integration:** Direct integration with the official Veo 3 API for video generation when it becomes available.
*   **Image-to-Video Support:** The ability to generate videos from a single image and a script.
*   **In-Browser Video Preview:** A feature to preview the generated videos directly in the browser.
*   **Batch Processing:** The ability to process multiple scripts at once.
