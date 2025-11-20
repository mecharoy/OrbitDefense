# Orbit Defense Implementation Guidelines

## Project Setup and Structure

Initialize your project with npm and create a package.json with essential scripts for development, building, and deployment. Configure Vite or Webpack for efficient bundling with proper production optimizations. Set up ESLint with a JavaScript style guide to maintain code consistency throughout development.

Your directory structure should separate concerns clearly. The src directory contains all game logic divided into modules: core for game loop and state management, entities for game objects, systems for physics and collision detection, rendering for all drawing logic, input for user interaction handling, and utils for helper functions. Keep index.html minimal with just a canvas element and script tag.

## Core Game Loop Implementation

The game loop forms the foundation of smooth gameplay. Use requestAnimationFrame for consistent timing across different devices. Calculate delta time between frames to ensure physics calculations remain frame-rate independent. Separate update logic from rendering to maintain clean architecture.

The basic loop structure processes input first, updates all game entities based on elapsed time, checks collisions and resolves interactions, renders the current frame, and then schedules the next frame. Implement pause functionality by stopping the loop but maintaining state.

## Orbital Mechanics System

Implementing realistic orbital movement requires careful mathematical modeling. Each satellite maintains its orbital radius, current angle, and angular velocity. Update positions each frame using parametric circle equations with angle incremented by angular velocity times delta time.

Different orbital speeds create strategic depth. Inner orbits complete rotations faster than outer ones, following simplified Kepler's laws. This creates gaps in coverage that players must account for when placing defenses. Implement smooth transitions when satellites change orbits through upgrades.

## Collision Detection Strategy

Spatial partitioning optimizes collision checks between numerous objects. Divide space into grid cells or use a quadtree structure. Only check collisions between objects in the same or adjacent cells. This reduces checks from O(n²) to near O(n) in practice.

For circular objects like satellites and projectiles, use distance-based collision. For irregular shapes, implement bounding box checks first, then precise collision if bounding boxes overlap. Maintain separate collision layers for different object types to further optimize checks.

## Rendering Pipeline

Layer-based rendering ensures proper draw order and enables optimizations. The background layer rarely changes, so consider caching it. The game object layer renders all entities sorted by depth. The effects layer handles particles and explosions. The UI layer draws score, resources, and controls on top.

Implement dirty rectangle tracking to redraw only changed screen regions. This significantly improves performance on lower-end devices. Use offscreen canvases for complex compositions that don't change every frame.

## Enemy Wave System

Design enemy waves with increasing difficulty and variety. Start with simple straight-path enemies to teach basic mechanics. Introduce spiral patterns that test orbital coverage. Add shielded enemies requiring specific weapon types. Create boss enemies with multiple phases and attack patterns.

Wave generation should feel random but fair. Use predetermined wave patterns with random variations. Ensure each wave is beatable with current player resources. Gradually increase enemy health, speed, and numbers. Introduce new enemy types at specific progression points.

## Resource and Upgrade System

Balance resource generation to maintain engaging pacing. Enemies drop energy proportional to their difficulty. Implement combo multipliers for quick successive kills. Provide baseline energy generation to prevent complete stalls.

Upgrade paths should offer meaningful choices. Weapon upgrades increase damage, fire rate, or range. Orbital upgrades allow satellites to change paths or move faster. Special abilities like temporary shields or screen-clearing bombs provide emergency options.

## Input Handling

Mouse controls should feel intuitive and responsive. Implement drag-and-drop for satellite placement with visual feedback showing valid placement zones. Highlight interactive elements on hover. Provide click-and-drag camera panning for larger play areas.

Touch controls require special consideration. Increase touch targets beyond visual element sizes. Implement touch-and-hold for continuous actions. Prevent accidental interactions with dead zones around screen edges. Handle multi-touch for pinch-zoom if implementing camera scaling.

## State Management

Centralized state management prevents bugs and enables features like save/load. Structure state as nested objects: game state (playing, paused, game over), player state (resources, score, unlocked upgrades), entity arrays (satellites, enemies, projectiles), and wave information (current wave, upcoming enemies).

Implement state persistence using localStorage. Serialize game state to JSON for saving. Validate loaded state to prevent corruption issues. Provide multiple save slots for experimentation.

## Audio Implementation

Web Audio API provides precise control over game audio. Create an audio context at game start after user interaction. Load and decode audio files into buffers for instant playback. Implement volume controls for music and effects separately.

Dynamic audio enhances immersion. Increase music tempo during intense waves. Layer additional instruments as difficulty rises. Use positional audio for off-screen warnings. Implement subtle feedback sounds for all player actions.

## Performance Monitoring

Build performance monitoring into the game from the start. Display FPS counter in development builds. Track frame time to identify performance spikes. Log slow frames with details about current game state.

Implement adaptive quality settings. Automatically reduce particle effects when FPS drops. Decrease enemy counts on slower devices. Provide manual quality options for player preference.

## Deployment Configuration

Configure Vercel deployment through vercel.json. Set up build commands to run your bundler. Configure routes for single-page application behavior. Enable compression for faster loads.

GitHub Actions can automate testing and deployment. Run tests on every push. Deploy to preview environments for pull requests. Automatically deploy to production on main branch updates.

## Polish and Game Feel

Small details significantly impact player satisfaction. Add screen shake for explosions and impacts. Implement smooth transitions for all UI elements. Use easing functions for natural-feeling movement. Add particle trails to projectiles and moving enemies.

Feedback clarity helps players understand game mechanics. Flash enemies when hit. Show damage numbers for weapon effectiveness comparison. Indicate satellite range with subtle circles. Animate resource collection to show cause and effect.

## Testing Approach

Implement debug modes early in development. Add keyboard shortcuts to spawn enemies, give resources, or skip waves. Create visualization modes for collision boxes and performance metrics. Log all significant events for debugging.

Playtest with diverse audiences. Watch new players to identify confusing mechanics. Test with experienced gamers for difficulty balance. Gather feedback on controls and visual clarity. Track metrics like average session length and progression points.