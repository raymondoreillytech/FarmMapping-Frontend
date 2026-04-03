# Frontend Handoff Context

Date: 2026-03-11

This file is intended for another Codex/ChatGPT window working only on the frontend repo.

Primary frontend repo:
- `C:\Tech\projects\FarmMapping-Frontend`

Related backend repo:
- `C:\Tech\projects\FarmMapping-Backend`

## Short Summary

The backend has just been refactored away from a prototype `observation` table into a proper tree inventory domain:
- `species`
- `tree_status`
- `tree`
- `tree_photo`

The frontend has not been updated yet to use that new model.

There is still a compatibility endpoint so the current map markers keep working:
- `GET /api/observations`
- `PATCH /api/observations/{id}/location`

New frontend work should be built around the new `/api/trees` API, not the old observation model.

The Python tree-identification sidecar is now wired through Spring. The frontend should still call Spring only, never the Python sidecar directly.

## Current Frontend State

The frontend is a Vite + React + React-Leaflet app.

Important files:
- `src/features/map/components/MapView.tsx`
- `src/features/map/layers/ObservationsLayer.tsx`
- `src/features/map/components/LayerControls.tsx`
- `vite.config.ts`
- `work.html`

What the frontend currently does:
- renders the basemap via `/api/tiles/metadata`
- can toggle a Trees layer and Zones layer
- fetches marker data from `/api/observations`
- lets the user drag a marker when edit mode is on
- sends marker location updates to `/api/observations/{id}/location`

Important current frontend behavior:
- the map rendering is based on a custom tile source whose metadata includes `bounds3857`
- Leaflet renders on a `3857` map, but marker positions are still consumed as normal `lat/lon`
- there is no tree creation form
- there is no species/status dropdown
- there is no tree detail panel
- there is no photo upload flow
- there is no frontend API layer for the new tree endpoints yet

Relevant local frontend config:
- `vite.config.ts` builds both `index.html` and `work.html`
- dev proxy points `/api` and `/icons` at `http://localhost:8080`

## Backend Domain Model

The backend now treats a tree as the canonical thing being stored.

### `species`

Database-backed lookup table. No more Java enum for species.

Seeded species codes:
- `unknown`
- `alder`
- `ash`
- `atlas_cedar`
- `maritime_pine`
- `med_cypress`
- `medronheiro`
- `oak`
- `olive`
- `stone_pine`
- `white_willow`

Notes:
- `oak` is intentionally generic for now
- in the future oak will likely split into more specific types
- species display names and icon keys come from the DB

### `tree_status`

Seeded status codes:
- `active`
- `dead`
- `removed`
- `needs_review`

### `tree`

Represents one canonical real-world tree.

Important fields:
- `id`
- `location` as PostGIS `geometry(Point, 4326)`
- `confirmed_species_code`
- `status_code`
- `notes`
- `created_at`
- `updated_at`
- `created_by_user_key`
- `updated_by_user_key`
- `created_by_ip`
- `updated_by_ip`

### `tree_photo`

Represents a photo attached to a tree. Multiple photos per tree are allowed.

Important fields:
- `id`
- `tree_id`
- `s3_bucket`
- `s3_key`
- `original_filename`
- `content_type`
- `size_bytes`
- `captured_at`
- `exif_location`
- `uploaded_by_user_key`
- `uploaded_by_ip`
- `is_primary`

Prediction metadata is also supported on `tree_photo`, but the owner does not currently expect to spend much time reviewing prediction history. Final user-confirmed species remains on `tree`.

## Spatial Conventions

This matters for frontend work.

Canonical backend/database CRS:
- `EPSG:4326`

Map rendering:
- basemap tiles are rendered in `EPSG:3857`

Frontend rule:
- treat API lat/lon and GeoJSON coordinates as `4326`
- let Leaflet project them onto the `3857` map
- do not try to store or send projected `3857` coordinates back to the backend

Coordinate order rules:
- API convenience fields use `lat` and `lon`
- GeoJSON uses `[lon, lat]`
- PostGIS storage is `Point(lon lat)`

## New Backend API Surface

These are the endpoints the frontend should move toward.

### 1. Create tree

`POST /api/trees`

Request body:

```json
{
  "lat": 39.123,
  "lon": -8.456,
  "confirmedSpeciesCode": "oak",
  "statusCode": "active",
  "notes": "Near the lower track",
  "createdByUserKey": "guest"
}
```

Behavior:
- `confirmedSpeciesCode` can be omitted and backend will default to `unknown`
- `statusCode` can be omitted and backend will default to `active`
- `createdByUserKey` can be omitted and backend will default to `guest`
- IP is captured server-side

Response shape:

```json
{
  "id": 123,
  "lat": 39.123,
  "lon": -8.456,
  "confirmedSpeciesCode": "oak",
  "confirmedSpeciesDisplayName": "Oak",
  "iconKey": "OakIcon",
  "statusCode": "active",
  "statusDisplayName": "Active",
  "notes": "Near the lower track",
  "createdAt": "2026-03-11T12:34:56Z",
  "updatedAt": "2026-03-11T12:34:56Z"
}
```

### 2. Update tree

`PATCH /api/trees/{id}`

All fields are optional.

Request body example:

```json
{
  "confirmedSpeciesCode": "olive",
  "statusCode": "needs_review",
  "notes": "Need to re-check in summer",
  "updatedByUserKey": "guest"
}
```

You can also update location:

```json
{
  "lat": 39.1234,
  "lon": -8.4567,
  "updatedByUserKey": "guest"
}
```

Important rule:
- if location is being updated via `PATCH /api/trees/{id}`, both `lat` and `lon` must be provided together

### 3. Delete tree

`DELETE /api/trees/{id}`

Behavior:
- hard delete
- backend also attempts to delete any linked photo objects from S3

### 4. List trees

`GET /api/trees`

Supported query params:
- `speciesCode`
- `statusCode`
- `lat`
- `lon`
- `radiusMeters`

Examples:

All trees:

```text
GET /api/trees
```

Only oaks:

```text
GET /api/trees?speciesCode=oak
```

Trees within 50m of a point:

```text
GET /api/trees?lat=39.123&lon=-8.456&radiusMeters=50
```

Filtered radius search:

```text
GET /api/trees?speciesCode=oak&statusCode=active&lat=39.123&lon=-8.456&radiusMeters=50
```

### 5. Polygon search

`POST /api/trees/search/polygon`

Request body:

```json
{
  "geoJson": {
    "type": "Polygon",
    "coordinates": [
      [
        [-8.456, 39.123],
        [-8.455, 39.123],
        [-8.455, 39.124],
        [-8.456, 39.124],
        [-8.456, 39.123]
      ]
    ]
  },
  "speciesCode": "oak",
  "statusCode": "active"
}
```

Supported:
- `Polygon`
- `MultiPolygon`
- also accepts a GeoJSON `Feature` with a polygon geometry

Do not send:
- `3857` projected coordinates
- `LineString`
- `Point`

### 6. Upload photo to an existing tree

`POST /api/trees/{id}/photos`

Content type:
- `multipart/form-data`

Required part:
- `file`

Optional part:
- `metadata`

Example metadata JSON:

```json
{
  "uploadedByUserKey": "guest",
  "isPrimary": true,
  "rawTopSpeciesCode": "oak",
  "rawTopConfidence": 0.84,
  "finalPredictedSpeciesCode": "oak",
  "finalPredictionConfidence": 0.84,
  "unknownPrediction": false,
  "modelVersion": "sweep_20260310_232455-resnet34_full_cosine_bs40_90ep",
  "topPredictionsJson": [
    { "speciesCode": "oak", "confidence": 0.84 },
    { "speciesCode": "olive", "confidence": 0.11 }
  ]
}
```

Notes:
- the metadata part is optional
- backend extracts EXIF GPS and EXIF capture time from the uploaded image bytes when present
- photos are stored in S3, not Postgres
- if no photos exist yet for a tree, the first one becomes primary automatically

### 7. Compatibility endpoints still kept for the current map

`GET /api/observations`

Response shape:

```json
[
  {
    "id": 123,
    "lat": 39.123,
    "lon": -8.456,
    "iconKey": "OakIcon",
    "label": "Oak"
  }
]
```

`PATCH /api/observations/{id}/location`

Request body:

```json
{
  "lat": 39.123,
  "lon": -8.456
}
```

Important:
- this endpoint is only there to keep the current frontend map working
- new frontend work should be based on `/api/trees`

## Tree Identification API

Spring now exposes the sidecar through backend endpoints.

### 1. Health

`GET /api/tree-identification/health`

Example response:

```json
{
  "status": "ok",
  "modelVersion": "sweep_20260310_232455-resnet34_full_cosine_bs40_90ep",
  "modelPath": "/models/tree_classifier_resnet34.pth",
  "labelsPath": "/models/labels.json",
  "backbone": "resnet34",
  "device": "cpu",
  "numClasses": 10,
  "classNames": [
    "alder",
    "ash",
    "atlas_cedar",
    "maritime_pine",
    "med_cypress",
    "medronheiro",
    "oak",
    "olive",
    "stone_pine",
    "white_willow"
  ],
  "unknownConfidenceThreshold": 0.75
}
```

### 2. Predict

`POST /api/tree-identification/predict`

Content type:
- `multipart/form-data`

Required part:
- `file`

Optional query param:
- `topK` default `3`, allowed `1..10`

Example response:

```json
{
  "modelVersion": "sweep_20260310_232455-resnet34_full_cosine_bs40_90ep",
  "predictions": [
    { "label": "oak", "confidence": 0.84 },
    { "label": "olive", "confidence": 0.11 },
    { "label": "ash", "confidence": 0.03 }
  ],
  "rawTopPrediction": "oak",
  "topPrediction": "oak",
  "topConfidence": 0.84,
  "top2Margin": 0.73,
  "isUnknown": false,
  "unknownReasons": [],
  "backbone": "resnet34",
  "device": "cpu"
}
```

Behavior:
- if the model thinks the image is too uncertain, `topPrediction` becomes `unknown`
- `rawTopPrediction` still shows the actual top class before unknown-thresholding
- this endpoint is the one the frontend should use for image identification

## Backend Gaps That The Frontend Must Know About

These are real current limitations.

### Species and status list endpoints now exist

The frontend can fetch lookup data directly from Spring:
- `GET /api/species`
- `GET /api/tree-status`

Both endpoints accept:
- `includeInactive=true|false`

Default behavior:
- only active records are returned

`GET /api/species` response items include:
- `code`
- `displayName`
- `scientificName`
- `iconKey`
- `unknown`
- `active`
- `sortOrder`

`GET /api/tree-status` response items include:
- `code`
- `displayName`
- `active`
- `sortOrder`

### Unknown icon asset is likely missing

Backend icon folder currently contains only:
- `OakIcon.png`
- `PineIcon.png`
- `PlaneIcon.png`
- `PricklyPearCactusIcon.png`

But the new backend seeds many species with:
- `UnknownTreeIcon`

So unless that icon file is added to the icon bucket/static source, marker icons for most of the new species will 404.

Frontend should defensively handle missing icons if possible.

## Recommended Frontend Work Order

This is the recommended order for the other AI/frontend session.

### Phase 1: Keep current map stable

- do not break tile metadata loading
- do not break existing `GET /api/observations` map markers
- do not break marker drag update
- add graceful fallback if `iconKey` points to a missing icon

### Phase 2: Introduce a proper tree API layer

Create frontend types and API helpers for:
- `Tree`
- `TreeStatusCode`
- `SpeciesCode`
- `getSpecies`
- `getTreeStatuses`
- `getTrees`
- `createTree`
- `updateTree`
- `deleteTree`
- `searchTreesByPolygon`
- `uploadTreePhoto`

Suggested place:
- `src/features/trees/api.ts`
- `src/features/trees/types.ts`

### Phase 3: Add manual tree creation and edit UI

Recommended first useful UI:
- click on map to create a tree at a location
- species dropdown
- status dropdown
- notes field
- save button

Recommended next:
- tree detail panel for an existing tree
- edit species
- edit status
- edit notes
- delete tree

### Phase 4: Replace observation compatibility usage

Longer term:
- stop using `/api/observations` for the real tree UI
- use `/api/trees` as the source of truth
- keep `/api/observations` only for backward compatibility until no longer needed

### Phase 5: Add filter/search UI

Valuable early filters:
- species filter
- status filter
- nearby/radius search

Later:
- draw polygon on map and call `/api/trees/search/polygon`

### Phase 6: Add identification + photo flow

Now that prediction exists in Spring:
- upload photo to `/api/tree-identification/predict`
- show suggested species
- allow user confirm/override
- create a tree with the confirmed species
- optionally attach the photo to the tree via `/api/trees/{id}/photos`

Important product behavior:
- the model is an assistant
- the user confirms the final species
- `tree.confirmedSpeciesCode` remains the source of truth

## Suggested Frontend Types

Use something close to this.

```ts
export type Tree = {
  id: number;
  lat: number;
  lon: number;
  confirmedSpeciesCode: string;
  confirmedSpeciesDisplayName: string;
  iconKey: string;
  statusCode: string;
  statusDisplayName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TreePhoto = {
  id: number;
  treeId: number;
  s3Bucket: string;
  s3Key: string;
  originalFilename: string | null;
  contentType: string | null;
  sizeBytes: number;
  createdAt: string;
  capturedAt: string | null;
  exifLat: number | null;
  exifLon: number | null;
  primary: boolean;
  rawTopSpeciesCode: string | null;
  rawTopConfidence: number | null;
  finalPredictedSpeciesCode: string | null;
  finalPredictionConfidence: number | null;
  unknownPrediction: boolean;
  modelVersion: string | null;
  topPredictionsJson: unknown;
};
```

## UX/Product Intent

This app is evolving toward a real tree inventory for land intelligence.

The owner wants future questions like:
- How many oaks are near the river?
- How many trees are on the hill?
- What species are mixed together a lot?

That means the frontend should increasingly think in terms of:
- canonical trees
- spatial filters
- species/status filtering
- later land-feature overlays and queries

Not in terms of:
- one-off photo observations as the primary record

## Important Boundaries For The Other AI Session

- Do frontend work only unless explicitly asked to change backend
- Do not talk directly to the Python inference sidecar from the frontend
- Frontend should continue to call Spring endpoints under `/api`
- Keep using `4326` lat/lon and GeoJSON at the API boundary
- Be careful not to assume icon files exist for all species yet

## Suggested Immediate Frontend Task

The best next frontend task is probably:

1. introduce a new tree API/types layer
2. keep the current marker map working
3. add a basic manual-create-tree flow
4. add edit/delete tree support
5. add species/status filters

That gives real value immediately even before ML prediction is wired in.
