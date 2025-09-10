<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class MedicalConditionCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'items' => $this->collection->map(function ($condition) {
                return (new MedicalConditionResource($condition))->toArray(request());
            }),
        ];
    }
}