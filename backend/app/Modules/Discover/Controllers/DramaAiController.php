<?php

namespace App\Modules\Discover\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Discover\Requests\AskChatbotRequest;
use App\Modules\Discover\Services\GeminiService;
use Illuminate\Http\JsonResponse;

class DramaAiController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    /**
     * Get an AI drama recommendation from Gemini.
     */
    public function recommend(AskChatbotRequest $request): JsonResponse
    {
        $reply = $this->geminiService->askRecommendation(
            $request->user(),
            $request->validated('message')
        );

        return response()->json([
            'reply' => $reply,
        ]);
    }

    /**
     * Alias for recommend action.
     */
    public function chatbot(AskChatbotRequest $request): JsonResponse
    {
        return $this->recommend($request);
    }
}
