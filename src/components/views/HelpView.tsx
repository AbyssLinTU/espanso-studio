import { BookOpen, Zap, Pencil, Variable, Layers, Save, RefreshCw, ChevronRight } from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Section = ({ icon, color, title, description, children }: SectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-[18px] font-bold text-[#F4F4F5]">{title}</h2>
        {description && <p className="text-[13px] text-[#71717A]">{description}</p>}
      </div>
    </div>
    <div className="pl-12 flex flex-col gap-3">
      {children}
    </div>
  </div>
);

interface StepProps {
  n: number;
  title: string;
  text: string;
}

const Step = ({ n, title, text }: StepProps) => (
  <div className="flex gap-3">
    <span className="mt-0.5 w-6 h-6 rounded-full bg-[#6366F1]/20 text-[#818CF8] text-[11px] font-bold flex items-center justify-center shrink-0">{n}</span>
    <div>
      <p className="text-[14px] font-semibold text-[#E4E4E7]">{title}</p>
      <p className="text-[13px] text-[#71717A] mt-0.5 leading-relaxed">{text}</p>
    </div>
  </div>
);



interface InfoCardProps {
  title: string;
  text: string;
  accent?: string;
}
const InfoCard = ({ title, text, accent = 'bg-[#6366F1]/10 border-[#6366F1]/30' }: InfoCardProps) => (
  <div className={`rounded-xl border px-4 py-3 ${accent}`}>
    <p className="text-[13px] font-semibold text-[#E4E4E7]">{title}</p>
    <p className="text-[12px] text-[#A1A1AA] mt-1 leading-relaxed">{text}</p>
  </div>
);

export const HelpView = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0B0B0D] flex justify-center">
      <div className="w-full max-w-3xl px-6 pt-20 pb-12 flex flex-col gap-12">

        {/* Hero */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#818CF8] text-[16px] font-extrabold">ES</div>
            <div>
              <h1 className="text-[28px] font-extrabold text-[#F4F4F5] tracking-tight leading-none">Espanso Studio Pro</h1>
              <p className="text-[13px] text-[#71717A]">User Guide</p>
            </div>
          </div>
          <p className="text-[15px] text-[#A1A1AA] leading-relaxed">
            Espanso Studio Pro is a visual editor for creating Espanso macros. Instead of manually editing YAML configuration files, you manage macros through a friendly interface, while the application automatically generates and persists the correct file format.
          </p>
        </div>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 1: Core Concept */}
        <Section
          icon={<BookOpen className="w-4 h-4 text-[#818CF8]" />}
          color="bg-[#6366F1]/10"
          title="How it Works"
          description="Core Concept"
        >
          <p className="text-[14px] text-[#A1A1AA] leading-relaxed">
            Espanso is a system-wide text expander that monitors your keyboard input and automatically replaces short triggers with pre-defined text. Espanso Studio Pro helps you manage these configurations visually.
          </p>
          <div className="flex items-center gap-3 bg-[#0F0F11] rounded-xl px-4 py-3 border border-[#2D2D30]">
            <Code text=":sig" />
            <ChevronRight className="w-4 h-4 text-[#52525B] shrink-0" />
            <span className="text-[14px] text-[#A1A1AA]">Best regards, John Doe</span>
          </div>
          <p className="text-[13px] text-[#71717A]">As soon as you type any trigger in any application — Espanso instantly replaces it with the designated text.</p>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 2: Navigation */}
        <Section
          icon={<Layers className="w-4 h-4 text-[#10B981]" />}
          color="bg-[#10B981]/10"
          title="Interface Navigation"
          description="Icon Sidebar (Left)"
        >
          <div className="flex flex-col gap-2">
            <NavItem icon="🏠" label="Home" text="View all your matches. Search, edit, or delete existing macros here." />
            <NavItem icon="＋" label="New Macro" text="Create a new macro from scratch. Opens the editor with empty fields." />
            <NavItem icon="↺" label="Restart" text="Manually restart the Espanso process to ensure it picks up the latest configuration changes." />
          </div>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 3: Creating macros */}
        <Section
          icon={<Zap className="w-4 h-4 text-[#F59E0B]" />}
          color="bg-[#F59E0B]/10"
          title="Creating a Macro"
          description="Quick Mode — Simple Text"
        >
          <Step n={1} title="Click '+' in the Sidebar" text="This opens the editor. The header will display 'Create Macro' for new items." />
          <Step n={2} title="Enter a Trigger" text="This is the keyword that activates the expansion. Recommended format: start with a colon, e.g., :email, :sig, :date." />
          <Step n={3} title="Enter Replacement Text" text="Type the text that should replace the trigger. It can span multiple lines." />
          <Step n={4} title="Click 'Save'" text="The macro is saved to memory, written to base.yml, and Espanso is automatically restarted. It's ready to use!" />
          <InfoCard title="💡 Hotkey" text={`Ctrl + S forces a save of all current state to disk, accessible even from the Home screen.`} />
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 4: Trigger options */}
        <Section
          icon={<Pencil className="w-4 h-4 text-[#6366F1]" />}
          color="bg-[#6366F1]/10"
          title="Trigger Settings"
          description="Word / Case / Prop — what do they mean?"
        >
          <div className="flex flex-col gap-2">
            <InfoCard
              accent="bg-[#6366F1]/10 border-[#6366F1]/30"
              title="Word — Word Boundary"
              text="The trigger only activates if preceded by a space or the start of a line. Enable this so ':it' doesn't fire inside the word 'bitter'. It also requires a separator (like a space) after the trigger."
            />
            <InfoCard
              accent="bg-[#10B981]/10 border-[#10B981]/30"
              title="Case — Case Sensitivity"
              text="By default, Espanso treats ':Hello' and ':hello' the same. Enable this option if the specific casing of your trigger matters."
            />
            <InfoCard
              accent="bg-[#F59E0B]/10 border-[#F59E0B]/30"
              title="Prop — Propagate Case"
              text="If you type the trigger with a Capital letter (:Hello), the replacement will also start with a capital. Great for professional signatures."
            />
          </div>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 5: Variables */}
        <Section
          icon={<Variable className="w-4 h-4 text-[#A78BFA]" />}
          color="bg-[#8B5CF6]/10"
          title="Variables in Replacement Text"
          description="Dynamic Data inside Macros"
        >
          <p className="text-[14px] text-[#A1A1AA] leading-relaxed">
            Sometimes you need dynamic content, like the current date or text from your clipboard. For this, we use variables.
          </p>
          <div className="flex flex-col gap-2">
            <VarItem name="{{date}}" color="text-[#34D399]" title="Date" text="Inserts the current date. You can choose the format (DD.MM.YYYY, etc.) in settings." />
            <VarItem name="{{time}}" color="text-[#60A5FA]" title="Time" text="Inserts the current system time in your preferred format." />
            <VarItem name="{{clipboard}}" color="text-[#F472B6]" title="Clipboard" text="Pastes whatever you currently have copied (Ctrl+C)." />
            <VarItem name="{{output}}" color="text-[#FBBF24]" title="Shell Command" text="Executes a terminal command and inserts the result. Example: echo 'Hello'." />
          </div>
          <p className="text-[14px] text-[#71717A] leading-relaxed">Use the <span className="text-[#E4E4E7] font-semibold">Quick Add</span> buttons in the editor to insert a variable. Configure its parameters in the card that appears below. You can rename variables directly in their cards — all instances in the text will update automatically.</p>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 6: Edit & Delete */}
        <Section
          icon={<Save className="w-4 h-4 text-[#10B981]" />}
          color="bg-[#10B981]/10"
          title="Editing & Deleting"
        >
          <Step n={1} title="Click the Pencil icon (✏️) on Home" text="The macro opens in the editor. You can change the trigger and text — the app remembers the original name and overwrites it correctly on save." />
          <Step n={2} title="Click 'Save' to apply changes" text="The modified macro replaces the old one, and Espanso restarts automatically." />
          <Step
            n={3}
            title="Click the Trash icon (🗑️) to delete"
            text="The macro is immediately removed from the list, the file is updated on disk, and Espanso restarts."
          />
          <InfoCard
            accent="bg-[#EF4444]/10 border-[#EF4444]/30"
            title="⚠️ Deletion is permanent"
            text="Once you click the trash icon, the macro is deleted immediately. Ensure you want to remove it. A backup of your file is automatically saved as base.bak."
          />
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        <div className="w-full h-px bg-[#1E1E21]" />
        
        {/* Section 8: Hotkeys */}
        <Section
          icon={<Zap className="w-4 h-4 text-[#FDE68A]" />}
          color="bg-[#FBBF24]/10"
          title="Shortcuts & Hotkeys"
          description="Master the Workflow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoCard title="Ctrl + S" text="Save and auto-restart Espanso" />
            <InfoCard title="Ctrl + B" text="Toggle Quick / Blueprint Mode" />
            <InfoCard title="Ctrl + N" text="Instantly create a New Macro" />
            <InfoCard title="Ctrl + F" text="Focus Search Bar (Home View)" />
            <InfoCard title="Ctrl + H" text="Go to Home Dashboard" />
            <InfoCard title="Ctrl + Z" text="Undo last action (Blueprint)" />
            <InfoCard title="Ctrl + Shift + Z" text="Redo (or use Ctrl + Y)" />
            <InfoCard title="Esc" text="Close Editor / Dismiss Previews" />
          </div>
        </Section>

        {/* Section 7: Tips */}
        <Section
          icon={<RefreshCw className="w-4 h-4 text-[#FB923C]" />}
          color="bg-[#F97316]/10"
          title="Tips & Tricks"
        >
          <div className="flex flex-col gap-2">
            <InfoCard title="Form Variables" text="Espanso can show an input dialog when a trigger fires. Use form variables for complex prompts that require user input at runtime." />
            <InfoCard title="Meaningful Trigger Prefixes" text="Try using prefixes: :@ for emails, :! for important templates, :/ for URLs. This helps organize your snippets mentally." />
            <InfoCard title="Backup File (.bak)" text="Every time you save, the app creates base.bak in your espanso/match folder. If something goes wrong, rename .bak back to .yml." />
            <div className="flex items-center gap-2 text-[13px] text-[#71717A]">
              <span>Your configuration file is located at:</span>
              <Code text="%APPDATA%\espanso\match\base.yml" />
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-8">
          <div className="w-6 h-6 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-[#818CF8] text-[10px] font-extrabold">ES</div>
          <span className="text-[12px] text-[#52525B]">Espanso Studio Pro · Built with Tauri + React</span>
        </div>
      </div>
    </div>
  );
};

// --- helpers ---

const Code = ({ text }: { text: string }) => (
  <code className="px-2 py-1 bg-[#151517] border border-[#2D2D30] rounded-lg text-[12px] font-mono text-[#818CF8] whitespace-nowrap">{text}</code>
);

const NavItem = ({ icon, label, text }: { icon: string; label: string; text: string }) => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 rounded-lg bg-[#1C1C1F] border border-[#2D2D30] flex items-center justify-center text-[14px] shrink-0">{icon}</div>
    <div>
      <p className="text-[14px] font-semibold text-[#E4E4E7]">{label}</p>
      <p className="text-[13px] text-[#71717A]">{text}</p>
    </div>
  </div>
);

const VarItem = ({ name, color, title, text }: { name: string; color: string; title: string; text: string }) => (
  <div className="flex gap-3 items-start bg-[#0F0F11] rounded-xl border border-[#1E1E21] px-4 py-3">
    <code className={`text-[13px] font-mono font-bold ${color} shrink-0 mt-0.5`}>{name}</code>
    <div>
      <p className="text-[13px] font-semibold text-[#E4E4E7]">{title}</p>
      <p className="text-[12px] text-[#71717A] mt-0.5">{text}</p>
    </div>
  </div>
);
