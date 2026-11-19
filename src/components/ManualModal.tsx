import { useMemo, useState } from 'react';
import { BookOpen, Search, Volume2, X } from 'lucide-react';
import { MANUAL_SECTIONS, searchManualSections, type ManualSection } from '../data/manualKnowledgeBase';

interface ManualModalProps {
  open: boolean;
  onClose: () => void;
  onTryVoiceCommand?: (example: string) => void;
}

const CATEGORY_LABELS: Record<ManualSection['category'] | 'all', string> = {
  all: 'Todo',
  inicio: 'Inicio',
  operacion: 'Uso diario',
  hardware: 'Escáner',
  planillas: 'Planillas',
  ia_nube: 'IA y Google',
  soporte: 'Ayuda / FAQ',
};

export function ManualModal({ open, onClose, onTryVoiceCommand }: ManualModalProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ManualSection['category'] | 'all'>('all');

  const sections = useMemo(() => {
    const base = query.trim() ? searchManualSections(query, MANUAL_SECTIONS.length) : MANUAL_SECTIONS;
    if (category === 'all') return base;
    return base.filter((s) => s.category === category);
  }, [query, category]);

  if (!open) return null;

  const speakSection = (section: ManualSection) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      `${section.title}. ${section.summary}. ${section.steps.join('. ')}`
    );
    utter.lang = 'es-AR';
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Manual de uso y ayuda">
      <div className="modal-card" style={{ maxWidth: 740 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} color="var(--primary)" />
              Manual de Uso y Base de Conocimiento
            </h2>
            <p className="panel-subtitle">
              Disponible 100% offline. También podés preguntarle cualquier duda al Asistente por voz o texto.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            aria-label="Cerrar manual"
          >
            <X size={18} />
          </button>
        </div>

        <div className="filter-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-muted)',
              }}
            />
            <input
              id="manual-search-input"
              className="input"
              style={{ paddingLeft: 34 }}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar duda: pistola USB, planillas, Google Drive, offline, pagos mixtos..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {(Object.keys(CATEGORY_LABELS) as Array<ManualSection['category'] | 'all'>).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${category === cat ? 'btn-primary' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {sections.length === 0 ? (
          <div className="empty-state">
            <strong>No encontramos coincidencias exactas</strong>
            <p>Probá con palabras como “pistola”, “planilla”, “Gemini”, “Google”, “offline” o “backup”.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((section) => (
              <article
                key={section.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'var(--bg)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <span className="tag" style={{ marginBottom: 4 }}>
                      {section.number}. {CATEGORY_LABELS[section.category]}
                    </span>
                    <h3 style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700 }}>{section.title}</h3>
                  </div>
                  {'speechSynthesis' in window && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      title="Escuchar esta sección en voz alta"
                      onClick={() => speakSection(section)}
                    >
                      <Volume2 size={14} />
                      Escuchar
                    </button>
                  )}
                </div>

                <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--ink-secondary)' }}>
                  {section.summary}
                </p>

                <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13.5 }}>
                  {section.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>

                {section.voiceExamples && section.voiceExamples.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div className="panel-subtitle" style={{ marginBottom: 5 }}>
                      Comandos de ejemplo (tocá uno para probarlo):
                    </div>
                    <div className="examples-row">
                      {section.voiceExamples.map((ex) => {
                        const cleanEx = ex.replace(/[“”"]/g, '');
                        return (
                          <button
                            key={ex}
                            type="button"
                            className="example-chip"
                            onClick={() => {
                              if (onTryVoiceCommand) {
                                onClose();
                                onTryVoiceCommand(cleanEx);
                              }
                            }}
                          >
                            {ex}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {section.tips && section.tips.length > 0 && (
                  <div className="notice-bar" style={{ marginTop: 10 }}>
                    <span>
                      <strong>Tip:</strong> {section.tips.join(' ')}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
