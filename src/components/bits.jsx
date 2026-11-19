import { Card, Icon } from '../m3/index.jsx';
import { colorOf } from '../data.js';

export function Dot({ project, size = 12 }) {
  return <span className="clp-dot" style={{ width: size, height: size, background: colorOf(project) }} aria-hidden="true" />;
}

export function StatCard({ icon, label, value, sub, children }) {
  return (
    <Card variant="outlined" className="clp-stat">
      <div className="clp-stat__head">
        <Icon name={icon} />
        <span className="label-large">{label}</span>
      </div>
      <div className="clp-stat__value">{value}</div>
      {children}
      {sub && <div className="body-small m3-muted">{sub}</div>}
    </Card>
  );
}

export function SectionTitle({ children, trailing }) {
  return (
    <div className="clp-section">
      <h2 className="title-medium">{children}</h2>
      {trailing}
    </div>
  );
}

export function SettingRow({ icon, title, desc, children }) {
  return (
    <div className="clp-setting">
      <Icon name={icon} />
      <div className="clp-setting__text">
        <div className="title-small">{title}</div>
        {desc && <div className="body-medium m3-muted">{desc}</div>}
      </div>
      {children && <div className="clp-setting__control">{children}</div>}
    </div>
  );
}
