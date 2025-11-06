export function TechnicalSummary() {
  return (
    <div className="py-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 px-4">
        Resumo Técnico - Bitcoin
      </h3>
      <div className="flex justify-center px-4">
        <div 
          id="technical-summary-widget" 
          style={{ 
            width: '100%', 
            maxWidth: '400px',
            height: '300px', 
            overflow: 'hidden', 
            border: '1px solid #e3e6eb', 
            borderRadius: '8px'
          }}
        >
          <iframe 
            src="https://br.widgets.investing.com/technical-summary?symbol=8968&interval=60&theme=light" 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowTransparency={true}
            style={{ margin: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
