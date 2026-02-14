import Card from '../common/Card';
import { ArrowRight } from 'lucide-react';

const DataCard = ({ title, children, onClick, icon: Icon }) => {
  return (
    <Card hoverable={!!onClick} onClick={onClick} className="h-full group overflow-hidden" variant="gradient">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-accent-500 border-2 border-dark-500 group-hover:bg-primary-500 transition-all group-hover:rotate-3">
              <Icon size={18} className="text-dark-500 group-hover:text-white transition-colors" strokeWidth={2.5} />
            </div>
          )}
          <h3 className="text-xs font-display text-dark-500 tracking-tight leading-none">
            {title}
          </h3>
        </div>
        {onClick && (
          <ArrowRight
            size={20}
            className="text-dark-400 group-hover:text-dark-500 transition-all group-hover:translate-x-2"
            strokeWidth={2.5}
          />
        )}
      </div>
      <div className="space-y-3 font-medium">{children}</div>
    </Card>
  );
};

export default DataCard;
