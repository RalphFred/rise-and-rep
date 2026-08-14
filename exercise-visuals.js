(() => {
  const frame = (id, label, art) => `
    <figure class="exercise-demo demo-${id}">
      <svg viewBox="0 0 320 190" role="img" aria-label="Animated demonstration of ${label}">
        <title>${label} movement demonstration</title>
        <rect class="demo-surface" x="2" y="2" width="316" height="186" rx="18" />
        <path class="demo-grid" d="M24 52H296M24 96H296M24 140H296" />
        <ellipse class="demo-shadow" cx="160" cy="160" rx="112" ry="10" />
        ${art}
      </svg>
      <figcaption><i aria-hidden="true"></i> LOOPING FORM GUIDE</figcaption>
    </figure>`;

  const visuals = {
    warmup: frame("warmup", "quick warm-up", `
      <g class="demo-person demo-bob">
        <circle class="demo-head" cx="160" cy="46" r="17" />
        <path class="demo-shirt" d="M142 66Q160 57 178 66L174 119H146Z" />
        <path class="demo-limb" d="M151 116L143 154M169 116L177 154" />
        <g class="demo-arm demo-arm-left"><path class="demo-limb" d="M146 72L112 91L91 71" /><circle class="demo-joint" cx="112" cy="91" r="5" /></g>
        <g class="demo-arm demo-arm-right"><path class="demo-limb" d="M174 72L208 91L229 71" /><circle class="demo-joint" cx="208" cy="91" r="5" /></g>
      </g>
      <path class="demo-motion" d="M83 59A29 29 0 0 1 111 32M237 59A29 29 0 0 0 209 32" />`),

    standardPushup: frame("pushup", "standard push-up", `
      <g class="demo-push-body">
        <circle class="demo-head" cx="247" cy="83" r="15" />
        <path class="demo-shirt" d="M221 76L144 73L131 96L210 101Z" />
        <path class="demo-limb" d="M143 84L78 103L43 139" />
        <path class="demo-limb" d="M221 89L204 118L220 151M207 91L189 119L191 151" />
        <circle class="demo-joint" cx="204" cy="118" r="5" />
      </g>
      <path class="demo-ground-contact" d="M181 154H230M31 154H62" />
      <path class="demo-motion" d="M265 70V111M258 102L265 111L272 102" />`),

    widePushup: frame("wide-pushup", "wide push-up", `
      <g class="demo-push-body">
        <circle class="demo-head" cx="247" cy="82" r="15" />
        <path class="demo-shirt" d="M221 76L144 73L131 96L210 101Z" />
        <path class="demo-limb" d="M143 84L78 103L43 139" />
        <path class="demo-limb" d="M219 90L180 118L159 151M211 92L245 119L272 151" />
        <circle class="demo-joint" cx="180" cy="118" r="5" /><circle class="demo-joint" cx="245" cy="119" r="5" />
      </g>
      <path class="demo-ground-contact" d="M148 154H171M261 154H284M31 154H62" />
      <path class="demo-motion" d="M294 67V111M287 102L294 111L301 102" />`),

    chairDips: frame("dips", "chair dip", `
      <path class="demo-prop" d="M63 56V157M63 91H127M127 91V157M47 157H76M112 157H141" />
      <g class="demo-dip-body">
        <circle class="demo-head" cx="168" cy="66" r="16" />
        <path class="demo-shirt" d="M148 85Q166 77 184 87L188 127L151 132Z" />
        <path class="demo-limb" d="M152 92L128 111L123 141M184 92L198 117L200 143" />
        <path class="demo-limb" d="M166 128L213 132L268 151M169 127L218 113L273 134" />
        <circle class="demo-joint" cx="213" cy="132" r="5" /><circle class="demo-joint" cx="218" cy="113" r="5" />
      </g>
      <path class="demo-motion" d="M221 55V94M214 85L221 94L228 85" />`),

    forearmPlank: frame("plank", "forearm plank", `
      <g class="demo-plank-body">
        <circle class="demo-head" cx="245" cy="91" r="15" />
        <path class="demo-shirt" d="M219 85L139 80L128 103L211 110Z" />
        <path class="demo-limb" d="M139 91L79 106L42 144" />
        <path class="demo-limb" d="M218 98L192 121L156 139M192 121H223" />
        <circle class="demo-core" cx="160" cy="94" r="22" />
      </g>
      <path class="demo-ground-contact" d="M145 145H232M31 149H59" />
      <path class="demo-motion" d="M149 55Q160 45 171 55" />`),

    bicycleCrunch: frame("bicycle", "bicycle crunch", `
      <g class="demo-crunch-body">
        <circle class="demo-head" cx="105" cy="91" r="16" />
        <path class="demo-shirt" d="M119 97L157 112L148 139L104 119Z" />
        <path class="demo-limb" d="M100 82L77 96M110 83L126 65" />
        <g class="demo-cycle-leg demo-cycle-a"><path class="demo-limb" d="M150 127L196 104L240 83" /><circle class="demo-joint" cx="196" cy="104" r="5" /></g>
        <g class="demo-cycle-leg demo-cycle-b"><path class="demo-limb" d="M150 128L190 143L246 148" /><circle class="demo-joint" cx="190" cy="143" r="5" /></g>
      </g>
      <path class="demo-ground-contact" d="M65 154H258" />
      <path class="demo-motion" d="M229 67A27 27 0 1 1 259 112" />`),

    mountainClimber: frame("climber", "mountain climber", `
      <g class="demo-climber-body">
        <circle class="demo-head" cx="247" cy="73" r="15" />
        <path class="demo-shirt" d="M220 72L155 78L148 102L219 99Z" />
        <path class="demo-limb" d="M216 88L229 118L232 151M205 91L197 120L189 151" />
        <g class="demo-climb-leg demo-climb-a"><path class="demo-limb" d="M156 90L113 113L78 147" /><circle class="demo-joint" cx="113" cy="113" r="5" /></g>
        <g class="demo-climb-leg demo-climb-b"><path class="demo-limb" d="M158 91L105 98L46 141" /><circle class="demo-joint" cx="105" cy="98" r="5" /></g>
      </g>
      <path class="demo-ground-contact" d="M177 154H244M35 151H91" />
      <path class="demo-motion" d="M93 60L115 60M82 73L110 73" />`),

    squat: frame("squat", "bodyweight squat", `
      <g class="demo-squat-upper">
        <circle class="demo-head" cx="160" cy="40" r="16" />
        <path class="demo-shirt" d="M142 60Q160 53 178 60L177 111H143Z" />
        <path class="demo-limb" d="M145 70L106 91L71 90M175 70L214 91L249 90" />
      </g>
      <g class="demo-squat-legs">
        <path class="demo-limb" d="M149 108L128 136L103 157M171 108L193 136L217 157" />
        <circle class="demo-joint" cx="128" cy="136" r="5" /><circle class="demo-joint" cx="193" cy="136" r="5" />
      </g>
      <path class="demo-ground-contact" d="M88 161H115M205 161H232" />
      <path class="demo-motion" d="M277 62V120M270 111L277 120L284 111" />`),

    shoulderRolls: frame("shoulder-rolls", "shoulder rolls", `
      <g class="demo-person demo-shoulders">
        <circle class="demo-head" cx="160" cy="44" r="17" />
        <path class="demo-shirt" d="M140 65Q160 55 180 65L176 120H144Z" />
        <path class="demo-limb" d="M144 72L117 111L112 151M176 72L203 111L208 151M151 117L144 157M169 117L176 157" />
        <circle class="demo-joint demo-shoulder-a" cx="142" cy="69" r="7" /><circle class="demo-joint demo-shoulder-b" cx="178" cy="69" r="7" />
      </g>
      <path class="demo-motion" d="M119 54A27 27 0 0 1 147 30M201 54A27 27 0 0 0 173 30" />`),

    armCircles: frame("arm-circles", "arm circles", `
      <g class="demo-person">
        <circle class="demo-head" cx="160" cy="43" r="17" />
        <path class="demo-shirt" d="M141 64Q160 56 179 64L176 119H144Z" />
        <g class="demo-circle-arm demo-circle-left"><path class="demo-limb" d="M145 71L108 72L70 72" /></g>
        <g class="demo-circle-arm demo-circle-right"><path class="demo-limb" d="M175 71L212 72L250 72" /></g>
        <path class="demo-limb" d="M151 117L145 157M169 117L175 157" />
      </g>
      <path class="demo-motion" d="M61 45A27 27 0 1 0 61 99M259 45A27 27 0 1 1 259 99" />`),

    catCow: frame("cat-cow", "cat cow", `
      <g class="demo-cat-body">
        <circle class="demo-head" cx="234" cy="88" r="14" />
        <path class="demo-shirt demo-cat-back" d="M218 94Q171 64 111 96L119 119Q169 96 219 111Z" />
        <path class="demo-limb" d="M122 106L104 131L104 157M210 104L228 131L229 157" />
        <circle class="demo-joint" cx="104" cy="131" r="5" /><circle class="demo-joint" cx="228" cy="131" r="5" />
      </g>
      <path class="demo-ground-contact" d="M88 160H117M215 160H244" />
      <path class="demo-motion" d="M126 54Q164 33 202 54" />`),

    hipHinge: frame("hip-hinge", "hip hinge stretch", `
      <g class="demo-hinge-legs">
        <path class="demo-limb" d="M160 107L149 154M167 107L184 154" />
        <path class="demo-ground-contact" d="M137 158H158M176 158H197" />
      </g>
      <g class="demo-hinge-upper">
        <path class="demo-shirt" d="M143 61Q160 53 177 61L174 111H146Z" />
        <circle class="demo-head" cx="160" cy="39" r="16" />
        <path class="demo-limb" d="M147 69L119 102L107 137M173 69L201 102L213 137" />
      </g>
      <circle class="demo-joint" cx="161" cy="108" r="6" />
      <path class="demo-motion" d="M206 52A63 63 0 0 1 231 107" />`),

    childsPose: frame("child-pose", "child's pose", `
      <g class="demo-child-body">
        <circle class="demo-head" cx="230" cy="124" r="15" />
        <path class="demo-shirt" d="M211 113Q174 85 139 107L151 136L211 139Z" />
        <path class="demo-limb" d="M145 118L112 105L82 139L54 151M207 131L242 143L278 151" />
        <circle class="demo-joint" cx="112" cy="105" r="5" />
      </g>
      <path class="demo-ground-contact" d="M41 155H291" />
      <path class="demo-motion" d="M150 69Q174 55 198 69" />`)
  };

  window.RiseRepVisuals = {
    get(id) {
      return visuals[id] || visuals.warmup;
    }
  };
})();
