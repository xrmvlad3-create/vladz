<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class CourseCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'items' => $this->collection->map(function ($course) {
                return (new CourseResource($course))->toArray(request());
            }),
        ];
    }
}