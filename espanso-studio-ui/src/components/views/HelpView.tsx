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
              <p className="text-[13px] text-[#71717A]">Руководство пользователя</p>
            </div>
          </div>
          <p className="text-[15px] text-[#A1A1AA] leading-relaxed">
            Espanso Studio Pro — это визуальный редактор для создания макросов Espanso. Вместо того чтобы вручную редактировать YAML, вы управляете макросами через удобный интерфейс, а приложение само генерирует и сохраняет нужный формат файла.
          </p>
        </div>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 1: Core Concept */}
        <Section
          icon={<BookOpen className="w-4 h-4 text-[#818CF8]" />}
          color="bg-[#6366F1]/10"
          title="Как это работает"
          description="Основная концепция"
        >
          <p className="text-[14px] text-[#A1A1AA] leading-relaxed">
            Espanso — это системная программа, которая следит за вашим вводом и автоматически заменяет короткие триггеры на заранее написанный текст. Espanso Studio Pro управляет конфигурационными файлами Espanso визуально.
          </p>
          <div className="flex items-center gap-3 bg-[#0F0F11] rounded-xl px-4 py-3 border border-[#2D2D30]">
            <Code text=":sig" />
            <ChevronRight className="w-4 h-4 text-[#52525B] shrink-0" />
            <span className="text-[14px] text-[#A1A1AA]">С уважением, Иван Иванов</span>
          </div>
          <p className="text-[13px] text-[#71717A]">Как только вы вводите любой триггер в любом приложении — Espanso мгновенно заменяет его на нужный текст.</p>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 2: Navigation */}
        <Section
          icon={<Layers className="w-4 h-4 text-[#10B981]" />}
          color="bg-[#10B981]/10"
          title="Навигация по интерфейсу"
          description="Боковая панель (слева)"
        >
          <div className="flex flex-col gap-2">
            <NavItem icon="🏠" label="Home" text="Список всех ваших макросов. Здесь можно редактировать и удалять существующие." />
            <NavItem icon="＋" label="New Macro" text="Создать новый макрос с чистого листа. Форма заполняется пустой." />
            <NavItem icon="↺" label="Restart" text="Перезапустить процесс Espanso, чтобы он подхватил изменения конфигурации вручную." />
          </div>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 3: Creating macros */}
        <Section
          icon={<Zap className="w-4 h-4 text-[#F59E0B]" />}
          color="bg-[#F59E0B]/10"
          title="Создание макроса"
          description="Quick Mode — простой текст"
        >
          <Step n={1} title="Нажмите «+» в боковой панели" text="Откроется редактор с пустыми полями. В заголовке будет написано «Create Macro»." />
          <Step n={2} title="Введите триггер" text="Это ключевое слово, которое запустит замену. Рекомендуемый формат: начинать с «:», например :email, :sig, :дата." />
          <Step n={3} title="Введите текст замены" text="В большом текстовом поле напишите то, чем будет заменён триггер. Это может быть несколько строк." />
          <Step n={4} title="Нажмите «Save»" text="Макрос сохраняется в памяти, записывается в base.yml и Espanso тут же перезапускается. Макрос готов к использованию!" />
          <InfoCard title="💡 Горячая клавиша" text={`Ctrl + S вызывает принудительное сохранение всех существующих макросов на диск, даже с экрана Home.`} />
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 4: Trigger options */}
        <Section
          icon={<Pencil className="w-4 h-4 text-[#6366F1]" />}
          color="bg-[#6366F1]/10"
          title="Настройки триггера"
          description="Word / Case / Prop — что это значит?"
        >
          <div className="flex flex-col gap-2">
            <InfoCard
              accent="bg-[#6366F1]/10 border-[#6366F1]/30"
              title="Word — Граница слова"
              text="Триггер срабатывает только если перед ним стоит пробел или начало строки. Включайте, чтобы :it не срабатывало внутри слова «bitter». Также важно, чтобы пробел (или другой разделитель) был и после триггера."
            />
            <InfoCard
              accent="bg-[#10B981]/10 border-[#10B981]/30"
              title="Case — Чувствительность к регистру"
              text="По умолчанию Espanso не различает :Hello и :hello. Включите эту опцию, если регистр триггера важен."
            />
            <InfoCard
              accent="bg-[#F59E0B]/10 border-[#F59E0B]/30"
              title="Prop — Propagate Case (Перенос регистра)"
              text="Если триггер набран с Заглавной буквы (:Hello), то и замена будет начинаться с заглавной. Удобно для профессиональных подписей."
            />
          </div>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 5: Variables */}
        <Section
          icon={<Variable className="w-4 h-4 text-[#A78BFA]" />}
          color="bg-[#8B5CF6]/10"
          title="Переменные в тексте замены"
          description="Динамические данные внутри макроса"
        >
          <p className="text-[14px] text-[#A1A1AA] leading-relaxed">
            Иногда в тексте нужен динамический контент, например, текущая дата или текст из буфера обмена. Для этого используются переменные.
          </p>
          <div className="flex flex-col gap-2">
            <VarItem name="{{date}}" color="text-[#34D399]" title="Дата" text="Подставляет текущую дату. В настройках можно выбрать формат (дд.мм.гггг и т.д.)." />
            <VarItem name="{{time}}" color="text-[#60A5FA]" title="Время" text="Подставляет текущее время в нужном формате." />
            <VarItem name="{{clipboard}}" color="text-[#F472B6]" title="Буфер обмена" text="Вставляет содержимое того, что вы скопировали (Ctrl+C) прямо сейчас." />
            <VarItem name="{{output}}" color="text-[#FBBF24]" title="Shell-команда" text="Выполняет команду в терминале и вставляет результат. Например: echo 'Hello'." />
          </div>
          <p className="text-[14px] text-[#71717A] leading-relaxed">Используйте кнопки <span className="text-[#E4E4E7] font-semibold">Quick Add</span> в редакторе, чтобы вставить переменную в текст. Настройте её параметры в карточке снизу. Переменную можно переименовать прямо в карточке — все вхождения в тексте обновятся автоматически.</p>
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 6: Edit & Delete */}
        <Section
          icon={<Save className="w-4 h-4 text-[#10B981]" />}
          color="bg-[#10B981]/10"
          title="Редактирование и удаление"
        >
          <Step n={1} title="На экране Home нажмите значок карандаша (✏️)" text="Макрос откроется в редакторе. Вы можете изменить и триггер, и текст замены — приложение запомнит оригинальное имя и корректно перезапишет его при сохранении." />
          <Step n={2} title="Нажмите «Save» для применения изменений" text="Измененный макрос заменит старый. Espanso перезапустится автоматически." />
          <Step
            n={3}
            title="Нажмите значок корзины (🗑️) для удаления"
            text="Макрос немедленно удаляется из списка, файл обновляется на диске и Espanso перезапускается."
          />
          <InfoCard
            accent="bg-[#EF4444]/10 border-[#EF4444]/30"
            title="⚠️ Удаление необратимо"
            text="После нажатия на корзину макрос не уходит в «Корзину» — он удаляется сразу. Убедитесь в правильности выбора. Резервная копия файла автоматически сохраняется как base.bak."
          />
        </Section>

        <div className="w-full h-px bg-[#1E1E21]" />

        {/* Section 7: Tips */}
        <Section
          icon={<RefreshCw className="w-4 h-4 text-[#FB923C]" />}
          color="bg-[#F97316]/10"
          title="Советы и хитрости"
        >
          <div className="flex flex-col gap-2">
            <InfoCard title="Форма ввода (Form Variable)" text="Espanso умеет показывать диалог ввода при срабатывании триггера. Используйте переменную типа form в YAML для сложных промптов." />
            <InfoCard title="Осмысленные имена триггеров" text="Используйте префиксы: :@ для email-адресов, :! для важных шаблонов, :/ для URL. Это поможет не забыть, какой триггер за что отвечает." />
            <InfoCard title="Backup-файл (.bak)" text="При каждом сохранении приложение создаёт base.bak в папке espanso/match. Если что-то пошло не так — переименуйте .bak обратно в .yml." />
            <div className="flex items-center gap-2 text-[13px] text-[#71717A]">
              <span>Файл конфигурации находится по адресу:</span>
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
