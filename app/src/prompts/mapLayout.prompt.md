Given these topics, organize them into groups and assign each a relative position on a 2D plane.

Topics:
{{topics}}

Output valid JSON with this exact structure:
```json
{
  "groups": [
    {
      "name": "Group Name",
      "topics": [
        { "name": "Topic Name", "x": 0.5, "y": 0.3 }
      ]
    }
  ]
}
```

Rules:
- x and y values must be between 0.0 and 1.0
- Related topics should be positioned close together
- Different groups should be spatially separated
- Each topic appears exactly once
- 3-6 groups is ideal
- Output ONLY the JSON, no other text
