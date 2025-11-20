# 🛸 Orbit Defense

A strategic space defense game where you protect your planet by managing orbital defense platforms. All defenses move in circular orbits around the planet, creating dynamic defensive patterns.

## 🎮 Game Concept

Defend your planet from waves of incoming enemies by strategically placing satellites in different orbital paths. Each satellite automatically targets and destroys threats within range. The challenge is managing your orbital coverage as enemies approach from multiple directions!

## ✨ Core Features

### Orbital Mechanics
- **Dynamic Orbits**: Satellites continuously circle your planet at different speeds
- **Inner orbits move faster** than outer ones, following simplified Kepler's laws
- **5 orbital paths** to choose from when placing defenses

### Weapon Systems
- **🟢 Laser Satellites** (20 Energy) - Fast-firing, precise single-target damage
- **🟠 Missile Satellites** (50 Energy) - Area-of-effect explosions for crowd control
- **🔵 Shield Satellites** (80 Energy) - Protect nearby satellites from damage

### Enemy Types
- **Basic** - Standard enemies, balanced speed and health
- **Fast** - Quick-moving threats that are harder to hit
- **Tank** - Heavily armored, slow-moving juggernauts
- **Shielded** - Protected enemies requiring multiple hits

### Movement Patterns
- **Straight** - Direct path to your planet
- **Spiral** - Circular approach that tests your coverage
- **Zigzag** - Unpredictable evasive patterns

## 🎯 Controls

### Mouse
- Click weapon button and drag to place satellites
- Satellites snap to the nearest orbital path
- Preview shows valid/invalid placement locations

### Keyboard Shortcuts
- `L` - Select Laser Satellite
- `M` - Select Missile Satellite
- `S` - Select Shield Satellite
- `P` - Pause/Resume Game
- `ESC` - Cancel placement

## 🎲 Gameplay Tips

1. **Balance Your Coverage**: Place satellites across multiple orbits to cover all angles
2. **Inner Orbits Are Faster**: Use them for quick-response defenses
3. **Mix Weapon Types**: Lasers for single targets, missiles for groups
4. **Watch Your Energy**: Collect energy from destroyed enemies and passive generation
5. **Plan for Waves**: Higher waves bring more enemies with new patterns

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ installed

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
OrbitDefense/
├── src/
│   ├── core/           # Game loop and state management
│   ├── entities/       # Game objects (Planet, Satellite, Enemy, Projectile)
│   ├── systems/        # Game systems (Collision, Waves)
│   ├── rendering/      # Rendering engine
│   ├── input/          # Input handling
│   └── utils/          # Utilities and constants
├── index.html          # Entry point
└── package.json        # Dependencies and scripts
```

## 🎨 Technical Highlights

- **60 FPS Performance**: Optimized game loop with requestAnimationFrame
- **Object Pooling**: Reduced garbage collection for smooth gameplay
- **Spatial Partitioning**: Efficient collision detection for many objects
- **Layer-based Rendering**: Organized draw calls for visual clarity
- **Responsive Design**: Scales to different screen sizes
- **Event-driven Architecture**: Clean separation of concerns

## 📊 Game Balance

| Wave | Enemies | Types Available | Patterns |
|------|---------|----------------|----------|
| 1-2  | 5-7     | Basic, Fast    | Straight |
| 3-4  | 9-11    | +Tank, Shielded| +Spiral  |
| 5+   | 13+     | All types      | All patterns |

## 🔧 Development

Built with:
- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- Vite for bundling

Best practices implemented:
- Frame-rate independent physics
- Delta time calculations
- State management patterns
- Resource optimization

## 📝 License

MIT License - Feel free to use and modify!

## 🎮 Play Now!

Deploy to Vercel:
```bash
npm run deploy
```

Or visit the live demo: [Your Deployed URL]

---

**Defend your planet. Master the orbits. Survive the waves!** 🌍✨