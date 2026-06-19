export interface Guide {
  slug: string;
  title: string;
  icon: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  warning?: string;
  steps: { title: string; body: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "change-spare-tyre",
    title: "Change a Spare Tyre",
    icon: "🛞",
    duration: "20–30 min",
    difficulty: "Easy",
    warning: "Park on level ground. Turn on hazard lights. Never get under a car held only by a jack.",
    steps: [
      { title: "Secure the vehicle", body: "Engage handbrake. Put car in 1st gear (or Park). Place wheel chocks or stones behind the wheel diagonally opposite the flat tyre." },
      { title: "Loosen the wheel nuts", body: "Use the wheel wrench to loosen (counter-clockwise) each nut by about half a turn while the tyre is still on the ground. Do not remove yet." },
      { title: "Position the jack", body: "Locate the manufacturer's jacking point on the chassis nearest the flat tyre. Raise the car until the tyre is ~5cm off the ground." },
      { title: "Remove the flat", body: "Fully unscrew the nuts and pull the wheel straight off. Place it under the car as a safety backup." },
      { title: "Mount the spare", body: "Lift the spare onto the hub. Hand-tighten the nuts in a star pattern." },
      { title: "Lower and final-tighten", body: "Lower the car. Tighten the nuts firmly in a star pattern using your body weight on the wrench. Do not exceed manufacturer torque." },
      { title: "Wrap up", body: "Stow the flat tyre, jack, and tools. Drive to a tyre shop within 80 km if using a 'space saver' spare — max 80 km/h." },
    ],
  },
  {
    slug: "handle-blowout",
    title: "Handle a Tyre Blowout",
    icon: "💥",
    duration: "Immediate",
    difficulty: "Hard",
    warning: "A blowout at speed is one of the most dangerous events on the highway. Do NOT brake hard — counterintuitive but critical.",
    steps: [
      { title: "Grip the wheel firmly", body: "Both hands. Expect a sudden pull toward the side of the blown tyre — correct gently, do not over-steer." },
      { title: "Do NOT brake", body: "Slamming the brakes causes weight to shift forward and the car to spin. Let the engine slow you naturally." },
      { title: "Ease off the accelerator gradually", body: "Allow speed to drop slowly. Keep the car pointed straight." },
      { title: "Signal and steer to the shoulder", body: "Once below ~30 km/h, gently brake and steer to the hard shoulder, well off the carriageway." },
      { title: "Hazard lights & warning triangle", body: "Turn on hazards. Place a reflective triangle 50–100m behind the car. Get all passengers behind the safety barrier, away from traffic." },
      { title: "Call for help", body: "Use RoadRescue or the highway helpline (1033 in India). Never attempt to change a tyre on the carriageway side." },
    ],
  },
  {
    slug: "jump-start-battery",
    title: "Jump-Start a Dead Battery",
    icon: "🔋",
    duration: "10–15 min",
    difficulty: "Medium",
    warning: "Never connect the negative cable directly to the dead battery's negative terminal — sparks near hydrogen gas can cause an explosion.",
    steps: [
      { title: "Park donor car nose-to-nose", body: "Both cars off, parking brakes on. Keys removed." },
      { title: "Red to dead positive", body: "Connect one red (positive) clamp to the dead battery's + terminal." },
      { title: "Red to good positive", body: "Connect the other red clamp to the good battery's + terminal." },
      { title: "Black to good negative", body: "Connect one black (negative) clamp to the good battery's − terminal." },
      { title: "Black to bare metal", body: "Clip the final black clamp to an unpainted metal bolt on the dead car's engine block — NOT the battery." },
      { title: "Start the donor, then the dead car", body: "Run donor for 2 minutes. Try starting the dead car. If it doesn't start in 3 tries, the battery is likely dead — call for help." },
      { title: "Disconnect in reverse order", body: "Black off engine, black off good battery, red off good, red off dead. Drive the rescued car for at least 30 minutes to recharge." },
    ],
  },
  {
    slug: "check-coolant",
    title: "Check Coolant & Overheating",
    icon: "🌡️",
    duration: "10 min",
    difficulty: "Easy",
    warning: "NEVER open the radiator cap on a hot engine — pressurised steam will cause serious burns. Wait 30+ minutes after stopping.",
    steps: [
      { title: "Pull over safely", body: "If the temp gauge climbs into the red, turn off A/C and turn the heater on full to draw heat away from the engine. Pull over as soon as it's safe." },
      { title: "Switch off and wait", body: "Open the bonnet to release heat. Wait at least 30 minutes for the engine to cool." },
      { title: "Inspect the reservoir", body: "Locate the translucent coolant reservoir (usually marked with MIN/MAX). Check the level against the cold mark." },
      { title: "Top up if low", body: "Use 50/50 pre-mixed coolant if available, or clean water in an emergency. Refit the cap firmly." },
      { title: "Look for leaks", body: "Check under the car for puddles. Look at hoses for splits or wet spots. A leak means you need a mechanic — don't keep driving." },
      { title: "Start carefully", body: "Restart and watch the gauge. If it climbs again, stop and call for towing — running an overheated engine causes permanent damage." },
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
