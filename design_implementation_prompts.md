# Claude Code Design Implementation Prompts - Experimental Vinyl Catalog

## Implementation Strategy

These prompts build the experimental design system in phases, each creating increasingly sophisticated visual effects. Run them sequentially after completing the functional MVP to transform it into a cutting-edge showcase.

---

## Phase 1: Foundation & Core Styling

```
ROLE: You are a senior frontend engineer specializing in cutting-edge web design and CSS3 advanced features.

OBJECTIVE: Implement the foundational design system for an experimental vinyl catalog website, including color palette, typography, and glassmorphism base styles.

DESIGN CONTEXT:
Building a "night-time digital experimentalism" aesthetic - dark, futuristic environment with glassmorphism, neon accents, and preparation for advanced 3D and animation features.

DESIGN SPECIFICATIONS:

Color System:
- Deep Space Black: #0a0a0a (main background)
- Charcoal: #1a1a1a (secondary backgrounds)  
- Electric Blue: #00d4ff (primary accent, glows, links)
- Neon Cyan: #00ffff (secondary accent, highlights)
- Acid Green: #39ff14 (success states)
- Hot Pink: #ff0080 (error states)

Glassmorphism Base:
- Card backgrounds: rgba(255, 255, 255, 0.05)
- Borders: rgba(255, 255, 255, 0.1)
- Backdrop filter: blur(10px) saturate(200%)
- Shadows: 0 8px 32px rgba(0, 0, 0, 0.3)

Typography:
- Primary: "Inter" or "Outfit" (clean, futuristic sans-serif)
- Geometric: "JetBrains Mono" (monospace elements)
- Hero: 4rem+ desktop / 2.5rem mobile
- Headers: 2.5rem desktop / 1.8rem mobile

TASKS:

1. Create global CSS variables in globals.css:
   ```css
   :root {
     --color-space-black: #0a0a0a;
     --color-charcoal: #1a1a1a;
     --color-electric-blue: #00d4ff;
     --color-neon-cyan: #00ffff;
     --color-acid-green: #39ff14;
     --color-hot-pink: #ff0080;
     
     --glass-bg: rgba(255, 255, 255, 0.05);
     --glass-border: rgba(255, 255, 255, 0.1);
     --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
     
     --gradient-primary: linear-gradient(135deg, #00d4ff 0%, #0080ff 50%, #8000ff 100%);
     --gradient-glow: radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%);
   }
   ```

2. Implement base typography system:
   - Import Google Fonts for Inter/Outfit
   - Set up responsive font scaling
   - Create utility classes for text styles
   - Implement base heading and body text styles

3. Create glassmorphism utility classes:
   ```css
   .glass-card {
     background: var(--glass-bg);
     border: 1px solid var(--glass-border);
     backdrop-filter: blur(10px) saturate(200%);
     box-shadow: var(--glass-shadow);
     border-radius: 16px;
   }
   ```

4. Update existing components to use new design system:
   - Apply dark background and neon accent colors
   - Transform current cards to glassmorphism style
   - Update navigation with glass styling
   - Ensure responsive typography works across devices

5. Create base animation utilities:
   - Hover effect classes
   - Transition utilities
   - Scale and glow animations
   - Preparation for advanced effects

SUCCESS CRITERIA:
- Site has cohesive dark, futuristic aesthetic
- All text is properly scaled and readable
- Glassmorphism cards look polished and modern
- Color palette is consistently applied
- Responsive design works across device sizes
- Foundation ready for 3D and animation layers

OUTPUT: Show the transformed site with new color scheme, typography, and glassmorphism styling applied to existing components.
```

---

## Phase 2: 3D Hero Section - Core Implementation

```
ROLE: You are a WebGL/Three.js specialist creating an unprecedented 3D web experience.

OBJECTIVE: Build a full-viewport 3D hero section featuring organically stacked cubes with rotating album artwork as the centerpiece of the vinyl catalog.

3D SPECIFICATIONS:

Hero Layout:
- Full viewport height (100vh)
- 3D cube arrangement taking center stage
- Minimal UI overlay (floating nav, subtle branding)
- Scroll indicator at bottom

Cube System:
- 8-12 cubes in organic stacking pattern (non-grid)
- Varied sizes: primary (200px), secondary (150px), accent (100px)
- Dark metallic material with glassmorphism faces
- 5-8 album covers visible (desktop) / 3-4 (mobile)

Artwork Behavior:
- Automatic rotation every 3-4 seconds
- Smooth fade transitions between albums
- Click on artwork navigates to album detail page
- Hover effects: subtle glow, 1.05x scale

TECHNICAL REQUIREMENTS:
- Three.js for 3D rendering
- React integration with proper cleanup
- Mobile-optimized performance
- Graceful fallback for unsupported devices

TASKS:

1. Install and configure Three.js:
   ```bash
   npm install three @types/three @react-three/fiber @react-three/drei
   ```

2. Create 3D Hero Component (`/components/3DHero.tsx`):
   ```typescript
   interface Cube3D {
     id: string;
     position: [number, number, number];
     size: number;
     hasArtwork: boolean;
     currentAlbum?: Album;
   }
   ```

3. Implement cube geometry and materials:
   - Box geometry with rounded edges
   - Materials: dark metallic base + glassmorphism faces
   - Texture loading for album artwork
   - Efficient geometry reuse

4. Create organic cube arrangement:
   - Predefined positions that look naturally stacked
   - Responsive positions for different screen sizes
   - Collision detection to prevent overlap
   - Visual balance and composition

5. Implement artwork rotation system:
   - Timer-based rotation through album collection
   - Smooth texture swapping with fade effects
   - Random selection algorithm avoiding repeats
   - Click event handling for navigation

6. Add lighting and environment:
   - Multiple colored light sources
   - Dynamic shadows on cubes
   - Ambient lighting for mood
   - Particle system preparation

7. Optimize for performance:
   - Efficient render loop
   - Texture optimization and caching
   - Mobile device detection and adaptation
   - FPS monitoring and quality adjustment

8. Create fallback for non-3D devices:
   - 2D equivalent using CSS transforms
   - Similar visual impact without WebGL
   - Progressive enhancement approach

SUCCESS CRITERIA:
- 3D cubes render smoothly at 60fps on desktop
- Album artwork rotates automatically and smoothly
- Click navigation to album details works
- Mobile version maintains visual impact
- No memory leaks or performance issues
- Fallback works on older devices

OUTPUT: Functional 3D hero section with cube arrangement and rotating album artwork that serves as an impressive landing experience.
```

---

## Phase 3: Glitch Effects & Advanced Typography

```
ROLE: You are a creative developer specializing in experimental web animations and text effects.

OBJECTIVE: Implement sophisticated glitch effects and animated typography that enhances the experimental aesthetic without compromising usability.

GLITCH EFFECT SPECIFICATIONS:

Text Glitch Animations:
- RGB channel separation effects
- Character scrambling with progressive reveal
- Flicker and static effects
- Scan line distortions

Visual Glitch Effects:
- Image pixelation and color aberration
- UI displacement and static bursts
- Random timing intervals
- User interaction triggers

Typography Animations:
- Progressive character reveal (typing effect)
- Glow animations with electric blue
- Distortion effects on headers
- Smooth transitions between states

TASKS:

1. Create glitch effect utilities (`/lib/glitch-effects.ts`):
   ```typescript
   interface GlitchConfig {
     intensity: number;
     frequency: number;
     rgbShift: boolean;
     scanLines: boolean;
     flicker: boolean;
   }
   ```

2. Implement text glitch animations (`/components/GlitchText.tsx`):
   ```css
   @keyframes glitch-rgb {
     0% { text-shadow: 0.05em 0 0 #ff0080, -0.05em -0.025em 0 #00ffff, 0.025em 0.05em 0 #39ff14; }
     15% { text-shadow: 0.05em 0 0 #ff0080, -0.05em -0.025em 0 #00ffff, 0.025em 0.05em 0 #39ff14; }
     16% { text-shadow: -0.05em -0.025em 0 #ff0080, 0.025em 0.025em 0 #00ffff, -0.05em -0.05em 0 #39ff14; }
     49% { text-shadow: -0.05em -0.025em 0 #ff0080, 0.025em 0.025em 0 #00ffff, -0.05em -0.05em 0 #39ff14; }
     50% { text-shadow: 0.025em 0.05em 0 #ff0080, 0.05em 0 0 #00ffff, 0 -0.05em 0 #39ff14; }
     99% { text-shadow: 0.025em 0.05em 0 #ff0080, 0.05em 0 0 #00ffff, 0 -0.05em 0 #39ff14; }
     100% { text-shadow: -0.025em 0 0 #ff0080, -0.025em -0.025em 0 #00ffff, -0.025em -0.05em 0 #39ff14; }
   }
   ```

3. Create typing animation component (`/components/TypedText.tsx`):
   - Character-by-character reveal
   - Cursor blink animation
   - Configurable speed and delay
   - Support for multiple text strings

4. Implement scan line effects (`/components/ScanLines.tsx`):
   - CSS-based scan line overlay
   - Animated movement across elements
   - Opacity and blend mode variations
   - Performance-optimized implementation

5. Build glitch trigger system:
   - Random interval glitches (ambient)
   - User interaction triggers (hover, click)
   - Scroll-based activation
   - Intensity variation based on context

6. Create advanced text effects:
   - Glow animations with CSS text-shadow
   - Character distortion using CSS transforms
   - Color cycling for accent text
   - Loading state animations

7. Apply effects to key components:
   - Site title with ambient glitch
   - Section headers with typing effect
   - Navigation items with hover glitch
   - Album titles with glow effects

8. Performance optimization:
   - CSS-only animations where possible
   - Efficient keyframe management
   - Reduced motion support
   - Mobile performance considerations

ACCESSIBILITY CONSIDERATIONS:
- Respect prefers-reduced-motion
- Maintain text readability during effects
- Provide static fallbacks
- Ensure contrast ratios remain accessible

SUCCESS CRITERIA:
- Text effects enhance without hindering readability
- Glitch animations feel intentional and polished
- Performance remains smooth across devices
- Effects support user accessibility preferences
- Visual impact creates memorable impression

OUTPUT: Site with sophisticated glitch and typography effects that feel cohesive with the experimental theme while maintaining excellent usability.
```

---

## Phase 4: Interactive Animations & Particle Systems

```
ROLE: You are a motion graphics developer creating premium web animations and particle effects.

OBJECTIVE: Implement advanced animation systems including particle effects, mouse tracking, scroll-triggered animations, and dynamic UI interactions.

ANIMATION SPECIFICATIONS:

Particle Systems:
- Floating geometric shapes in background
- Light particles following mouse movement
- Ambient particles around 3D cubes
- Performance-optimized canvas rendering

Mouse Interactions:
- Elements respond to cursor proximity
- Parallax effects based on mouse position
- Hover animations with physics-based easing
- Click ripple effects

Scroll Animations:
- Elements fade/slide in with scroll position
- Multi-layer parallax backgrounds
- Velocity-based animation speed
- Section transition effects

TASKS:

1. Create particle system (`/components/ParticleSystem.tsx`):
   ```typescript
   interface Particle {
     x: number;
     y: number;
     vx: number;
     vy: number;
     size: number;
     opacity: number;
     color: string;
     shape: 'circle' | 'triangle' | 'square';
   }
   ```

2. Implement canvas-based particle rendering:
   - Efficient particle pool management
   - Various geometric shapes (circles, triangles, squares)
   - Color variations using design system palette
   - Smooth animation loop with requestAnimationFrame

3. Create mouse tracking system (`/hooks/useMouseTracking.ts`):
   - Global mouse position tracking
   - Debounced updates for performance
   - Distance calculations for proximity effects
   - Mobile touch support

4. Build hover animation utilities:
   ```css
   .hover-lift {
     transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   }
   .hover-lift:hover {
     transform: translateY(-8px) scale(1.02);
   }
   ```

5. Implement scroll-triggered animations (`/hooks/useScrollAnimation.ts`):
   - Intersection Observer for element visibility
   - Scroll velocity calculation
   - Staggered animation delays
   - Smooth easing functions

6. Create ripple effect system (`/components/RippleEffect.tsx`):
   - Click position calculation
   - Expanding circle animation
   - Multiple simultaneous ripples
   - Integration with buttons and cards

7. Build parallax background layers:
   - Multiple moving geometric shapes
   - Different movement speeds by layer
   - Mouse-influenced movement
   - Subtle ambient animation

8. Implement micro-animations:
   - Button press feedback
   - Loading state animations
   - Form input focus effects
   - Navigation transitions

9. Create scroll-based reveal animations:
   - Slide up/fade in effects
   - Staggered grid animations
   - Section transition reveals
   - Progress-based animations

10. Advanced effects integration:
    - Particle trails on hover
    - Dynamic lighting effects
    - Morphing geometric shapes
    - Ambient movement patterns

PERFORMANCE OPTIMIZATIONS:
- Use transform and opacity for animations
- Implement virtual particle culling
- Debounce expensive calculations
- Use CSS containment for isolated animations
- Monitor frame rate and adjust quality

MOBILE CONSIDERATIONS:
- Reduced particle count on mobile
- Touch-based interactions
- Performance-conscious effects
- Battery usage optimization

SUCCESS CRITERIA:
- Smooth 60fps animations across all devices
- Particle effects enhance without overwhelming
- Mouse interactions feel responsive and natural
- Scroll animations create engaging progression
- Mobile performance remains excellent
- Effects contribute to experimental aesthetic

OUTPUT: Fully interactive site with sophisticated animation systems that create an immersive, responsive experience showcasing advanced web animation capabilities.
```

---

## Phase 5: Advanced Visual Effects & WebGL Shaders

```
ROLE: You are a WebGL specialist and shader developer creating cutting-edge visual effects for web applications.

OBJECTIVE: Implement advanced visual effects including custom shaders, dynamic backgrounds, and experimental rendering techniques that push the boundaries of web graphics.

SHADER SPECIFICATIONS:

Background Effects:
- Animated gradient meshes
- Flowing particle fields
- Dynamic lighting systems
- Color-reactive backgrounds

Fragment Shaders:
- Custom noise functions
- Animated distortion effects
- Color cycling and morphing
- Interactive visual responses

WebGL Integration:
- Three.js shader materials
- Real-time parameter control
- Performance optimization
- Fallback strategies

TASKS:

1. Create shader background component (`/components/ShaderBackground.tsx`):
   ```glsl
   // Fragment shader for animated background
   uniform float u_time;
   uniform vec2 u_resolution;
   uniform vec2 u_mouse;
   
   void main() {
     vec2 st = gl_FragCoord.xy / u_resolution.xy;
     st.x *= u_resolution.x / u_resolution.y;
     
     // Animated noise pattern
     float noise = snoise(st * 3.0 + u_time * 0.1);
     
     // Color palette based on design system
     vec3 color1 = vec3(0.0, 0.831, 1.0); // Electric blue
     vec3 color2 = vec3(0.0, 1.0, 1.0);   // Neon cyan
     vec3 color3 = vec3(0.224, 1.0, 0.078); // Acid green
     
     vec3 finalColor = mix(color1, color2, noise);
     finalColor = mix(finalColor, color3, sin(u_time * 0.5) * 0.5 + 0.5);
     
     gl_FragColor = vec4(finalColor * 0.1, 1.0);
   }
   ```

2. Implement noise functions library (`/shaders/noise.glsl`):
   - Perlin noise implementation
   - Simplex noise functions
   - Fractal noise variations
   - Optimized performance versions

3. Create interactive shader effects:
   - Mouse position uniforms
   - Time-based animations
   - Audio-reactive elements (if available)
   - Color palette cycling

4. Build dynamic lighting system:
   - Multiple colored light sources
   - Animated light movement
   - Shadow casting effects
   - Bloom and glow post-processing

5. Implement post-processing effects:
   - Screen-space distortion
   - Color grading and tone mapping
   - Chromatic aberration
   - Film grain and noise overlay

6. Create WebGL texture effects:
   - Dynamic texture generation
   - Real-time texture manipulation
   - Animated UV mapping
   - Multi-layer blending

7. Build experimental visual elements:
   ```typescript
   // Example: Fluid simulation background
   const FluidBackground = () => {
     const shaderRef = useRef<ShaderMaterial>();
     
     useFrame((state) => {
       if (shaderRef.current) {
         shaderRef.current.uniforms.u_time.value = state.clock.elapsedTime;
         shaderRef.current.uniforms.u_mouse.value = [
           state.mouse.x,
           state.mouse.y
         ];
       }
     });
   };
   ```

8. Implement progressive enhancement:
   - WebGL capability detection
   - Quality level adaptation
   - Graceful fallbacks to CSS
   - Performance monitoring

9. Create shader-based album cover effects:
   - Holographic album displays
   - 3D depth illusions
   - Dynamic reflections
   - Animated vinyl record materials

10. Advanced integration features:
    - Shader parameter control via UI
    - Real-time quality adjustment
    - Custom material creation
    - Effect composition system

PERFORMANCE CONSIDERATIONS:
- Efficient uniform updates
- Texture memory management
- Shader compilation optimization
- Mobile GPU compatibility
- Frame rate targeting

CREATIVE APPLICATIONS:
- Background ambient effects
- Album artwork enhancement
- Navigation transition effects
- Loading screen animations
- Interactive visual responses

SUCCESS CRITERIA:
- Custom shaders render smoothly across devices
- Effects enhance aesthetic without overwhelming content
- Performance scales appropriately by device capability
- Visual effects feel cohesive with overall design
- Experimental elements showcase advanced technical skills
- Fallbacks maintain visual appeal

OUTPUT: Cutting-edge visual effects system using custom WebGL shaders that creates an unprecedented web experience while maintaining performance and accessibility.
```

---

## Phase 6: Responsive Optimization & Performance Polish

```
ROLE: You are a performance optimization specialist ensuring the experimental design system works flawlessly across all devices and use cases.

OBJECTIVE: Optimize the advanced visual effects for production deployment while maintaining the experimental aesthetic and ensuring excellent performance across desktop, tablet, and mobile devices.

OPTIMIZATION TARGETS:
- 60fps animations on all supported devices
- <3 second load times on 3G connections
- Smooth interactions during heavy visual effects
- Battery-conscious mobile performance
- Accessibility compliance with advanced effects

TASKS:

1. Implement performance monitoring system (`/lib/performance-monitor.ts`):
   ```typescript
   interface PerformanceMetrics {
     fps: number;
     memoryUsage: number;
     renderTime: number;
     effectsQuality: 'high' | 'medium' | 'low';
   }
   ```

2. Create adaptive quality system:
   - Device capability detection (GPU, CPU, memory)
   - Dynamic quality adjustment based on performance
   - User preference overrides
   - Automatic degradation on performance issues

3. Optimize 3D rendering pipeline:
   - Geometry level-of-detail (LOD) system
   - Texture compression and optimization
   - Efficient material sharing
   - Frustum culling implementation

4. Implement smart asset loading:
   - Progressive loading of 3D assets
   - Preloading critical visual elements
   - Lazy loading of secondary effects
   - Asset size optimization

5. Create responsive effect scaling:
   ```typescript
   const getEffectQuality = (screenSize: string, deviceType: string) => {
     if (deviceType === 'mobile' && screenSize === 'small') {
       return {
         particleCount: 50,
         shaderComplexity: 'low',
         animationFrequency: 30
       };
     }
     // ... other configurations
   };
   ```

6. Optimize animation performance:
   - Use CSS transforms over layout properties
   - Implement animation pooling for repeated effects
   - Debounce expensive calculations
   - GPU-accelerated animations where possible

7. Build accessibility enhancement system:
   - Respect prefers-reduced-motion completely
   - High contrast mode support
   - Keyboard navigation for all 3D interactions
   - Screen reader compatibility with dynamic content

8. Implement memory management:
   - Proper cleanup of WebGL contexts
   - Texture memory monitoring
   - Animation frame cleanup
   - Event listener management

9. Create mobile-specific optimizations:
   - Touch-optimized 3D interactions
   - Reduced particle systems
   - Battery usage monitoring
   - Heat-based performance scaling

10. Build comprehensive fallback system:
    - Progressive enhancement layers
    - CSS-only versions of key effects
    - Static image fallbacks for 3D elements
    - Graceful degradation messaging

11. Implement caching strategies:
    - Shader compilation caching
    - Asset caching with service workers
    - Animation state preservation
    - User preference caching

12. Create development tools:
    - Performance debug overlay
    - Effect quality toggles
    - Real-time metrics display
    - A/B testing framework for effects

RESPONSIVE BREAKPOINTS:
- Mobile: 320px-767px (simplified effects, touch-optimized)
- Tablet: 768px-1199px (moderate effects, hybrid input)
- Desktop: 1200px+ (full effects, mouse-optimized)
- Large: 1440px+ (enhanced effects, multiple displays)

PERFORMANCE BUDGETS:
- Initial load: <3s on 3G
- 3D scene initialization: <1s
- Animation frame time: <16ms (60fps)
- Memory usage: <100MB on mobile
- Battery drain: Minimal impact

ACCESSIBILITY REQUIREMENTS:
- All effects respect reduced motion preferences
- Keyboard navigation works for all interactive elements
- Screen readers can access core functionality
- High contrast alternatives available
- Focus indicators visible during all animations

SUCCESS CRITERIA:
- Consistent 60fps across target devices
- No accessibility violations
- Smooth experience on mobile devices
- Professional performance metrics
- Effects enhance rather than hinder usability
- Graceful degradation maintains core functionality

OUTPUT: Production-ready experimental design system that delivers cutting-edge visual effects while maintaining excellent performance, accessibility, and usability across all devices and user preferences.
```

---

## Integration Checklist

After completing all phases, verify:

- [ ] 3D hero section works smoothly on all devices
- [ ] Glassmorphism styling is consistent across components
- [ ] Glitch effects enhance without hindering usability
- [ ] Particle systems perform well on mobile
- [ ] Shader effects have proper fallbacks
- [ ] All animations respect accessibility preferences
- [ ] Performance meets or exceeds targets
- [ ] Design system feels cohesive and experimental
- [ ] Site showcases advanced technical capabilities
- [ ] User experience remains intuitive despite complexity

## Usage Notes

1. **Sequential Implementation**: Each phase builds on previous work
2. **Performance Testing**: Monitor metrics after each phase
3. **Device Testing**: Test on actual mobile devices regularly
4. **Accessibility Validation**: Check accessibility after major changes
5. **Fallback Verification**: Ensure graceful degradation works
6. **Portfolio Impact**: Document advanced techniques used for portfolio presentation

This experimental design system will create an unprecedented web experience that showcases cutting-edge technical skills while maintaining excellent usability and performance.