# Ensure correct encoding (UTF-8 without BOM) when modifying App.tsx
$appPath = "C:\Users\USER\.gemini\antigravity\scratch\photo-booth\client\src\App.tsx"

if (Test-Path $appPath) {
    # Read as UTF-8 string
    $content = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

    # Let's locate the selection card container block
    # Search for: <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
    # and replace the whole container up to the closing tags before {step === 'mode' && (

    $targetText = @'
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Option 1: 2x6 strip pair */}
              <div 
                onClick={() => {
                  setLayout('2x6-strip-pair');
                  setStep(mode === 'capture' ? 'capture' : 'upload');
                }}
                className="glass-card" 
                style={{ 
                  padding: '32px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-pink)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(244, 63, 94, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: 'rgba(244, 63, 94, 0.1)', 
                  color: 'var(--accent-neon-pink)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <Columns size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>2x6 세로 4컷</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
                  가장 대중적인 세로형 4컷 스트립 규격입니다. 두 줄로 나뉘어 출력하기에 용이합니다. (가로형 사진)
                </p>
                <div style={{ 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-tertiary)', 
                  fontSize: '0.8rem', 
                  fontWeight: 700,
                  color: 'var(--accent-neon-pink)'
                }}>
                  가로 4 : 세로 3 촬영 비율
                </div>
              </div>

              {/* Option 2: 2x2 grid postcard */}
              <div 
                onClick={() => {
                  setLayout('2x2-grid');
                  setStep(mode === 'capture' ? 'capture' : 'upload');
                }}
                className="glass-card" 
                style={{ 
                  padding: '32px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-cyan)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: 'rgba(6, 182, 212, 0.1)', 
                  color: 'var(--accent-neon-cyan)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <Layout size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>2x2 엽서 그리드</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
                  4x6 인치 엽서 크기 규격입니다. 시원한 2행 2열 배치로 인쇄 및 소장에 유리합니다. (세로형 사진)
                </p>
                <div style={{ 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-tertiary)', 
                  fontSize: '0.8rem', 
                  fontWeight: 700,
                  color: 'var(--accent-neon-cyan)'
                }}>
                  가로 3 : 세로 4 촬영 비율
                </div>
              </div>
            </div>
'@

    $newText = @'
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
              {/* Option 1: 4컷 세로 스트립 (2장 세트) */}
              <div 
                onClick={() => {
                  setLayout('2x6-strip-pair');
                  setStep(mode === 'capture' ? 'capture' : 'upload');
                }}
                className="glass-card" 
                style={{ 
                  padding: '36px 28px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-pink)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(244, 63, 94, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Visual Mockup for 4-Cut Strip */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #fbcfe8, #fda4af)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginBottom: '24px',
                  boxShadow: '0 8px 16px rgba(244, 63, 94, 0.15)'
                }}>
                  {/* Left Film Strip */}
                  <div style={{
                    width: '34px',
                    height: '108px',
                    background: '#111115',
                    borderRadius: '4px',
                    padding: '4px 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transform: 'rotate(-10deg) translateX(-14px)',
                    position: 'absolute',
                    zIndex: 2
                  }}>
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} style={{ width: '28px', height: '20px', background: '#fff', borderRadius: '1.5px', opacity: 0.95 }} />
                    ))}
                    <div style={{ width: '12px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', marginTop: '1px' }} />
                  </div>
                  {/* Right Film Strip */}
                  <div style={{
                    width: '34px',
                    height: '108px',
                    background: '#111115',
                    borderRadius: '4px',
                    padding: '4px 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transform: 'rotate(10deg) translateX(14px)',
                    position: 'absolute',
                    zIndex: 1
                  }}>
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} style={{ width: '28px', height: '20px', background: '#fff', borderRadius: '1.5px', opacity: 0.95 }} />
                    ))}
                    <div style={{ width: '12px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', marginTop: '1px' }} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '10px', color: 'var(--text-main)' }}>4컷 세로 스트립 (2장 세트)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px', minHeight: '66px' }}>
                  포토부스에서 출력되는 길쭉한 4컷 스트립 2장 세트입니다. 가로형 사진에 적합하며, 한 장씩 나눠 가지기 좋습니다.
                </p>
                <div style={{ 
                  display: 'inline-block',
                  padding: '8px 24px', 
                  borderRadius: '99px', 
                  background: 'rgba(244, 63, 94, 0.08)', 
                  fontSize: '0.85rem', 
                  fontWeight: 800,
                  color: 'var(--accent-neon-pink)'
                }}>
                  가로 사진 4매
                </div>
              </div>

              {/* Option 2: 2x2 엽서 프레임 (1장) */}
              <div 
                onClick={() => {
                  setLayout('2x2-grid');
                  setStep(mode === 'capture' ? 'capture' : 'upload');
                }}
                className="glass-card" 
                style={{ 
                  padding: '36px 28px', 
                  borderRadius: '24px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon-cyan)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(6, 182, 212, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Visual Mockup for Postcard Frame */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #a7f3d0, #22d3ee)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginBottom: '24px',
                  boxShadow: '0 8px 16px rgba(6, 182, 212, 0.15)'
                }}>
                  {/* Miniature Postcard Container */}
                  <div style={{
                    width: '78px',
                    height: '110px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                    padding: '8px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.8)'
                  }}>
                    {/* 2x2 slots inside mockup */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '4px',
                      height: '76px'
                    }}>
                      {[1, 2, 3, 4].map(idx => (
                        <div key={idx} style={{ background: '#e2e8f0', borderRadius: '2px', opacity: 0.9 }} />
                      ))}
                    </div>
                    {/* Tiny decorative bottom */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24', opacity: 0.9 }} />
                      <div style={{ width: '42px', height: '5px', background: '#94a3b8', borderRadius: '1px', opacity: 0.8 }} />
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '10px', color: 'var(--text-main)' }}>2x2 엽서 프레임 (1장)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px', minHeight: '66px' }}>
                  4x6 인치 엽서 크기 프레임에 세로형 사진 4장을 배치합니다. 시원한 크기로 소장에 유리합니다.
                </p>
                <div style={{ 
                  display: 'inline-block',
                  padding: '8px 24px', 
                  borderRadius: '99px', 
                  background: 'rgba(6, 182, 212, 0.08)', 
                  fontSize: '0.85rem', 
                  fontWeight: 800,
                  color: 'var(--accent-neon-cyan)'
                }}>
                  세로 사진 4매
                </div>
              </div>
            </div>
'@

    # Normalize carriage returns for exact string matching in case line endings differ
    $normTarget = $targetText.Replace("`r`n", "`n").Replace("`n", "`r`n").Trim()
    $normContent = $content.Replace("`r`n", "`n").Replace("`n", "`r`n")

    if ($normContent.Contains($normTarget)) {
        $normContent = $normContent.Replace($normTarget, $newText.Replace("`r`n", "`n").Replace("`n", "`r`n").Trim())
        [System.IO.File]::WriteAllText($appPath, $normContent, [System.Text.Encoding]::UTF8)
        Write-Host "App.tsx successfully updated via PowerShell replacement!"
    } else {
        # Fallback: simpler replacement using regex or substring mapping in case comment strings differ
        Write-Warning "Exact match failed. Attempting robust regex-based layout selection card replacement..."
        
        # Let's target the code between '프레임 규격 선택' block end and 'step === "mode"' start.
        $gridStartTag = '<div style={{ display: ''grid'', gridTemplateColumns: ''repeat(auto-fit, minmax(300px, 1fr))'', gap: ''24px'' }}>'
        $gridEndTag = '</div>'
        
        # Locate App.tsx container index
        $indexStart = $normContent.IndexOf($gridStartTag)
        if ($indexStart -ge 0) {
            # Find the closing grid container tag
            # We want to replace everything from $gridStartTag to the closing </div> that matches layout selection grid.
            # To be absolutely sure, we'll locate the next '{step === 'mode' && ('
            $stepModeTag = "{step === 'mode' && ("
            $indexEnd = $normContent.IndexOf($stepModeTag, $indexStart)
            if ($indexEnd -ge 0) {
                # Find the closing </div> right before $stepModeTag
                $subContent = $normContent.Substring($indexStart, $indexEnd - $indexStart)
                # Find last </div> in the subcontent
                $lastDivIdx = $subContent.LastIndexOf("</div>")
                if ($lastDivIdx -ge 0) {
                    $replaceLength = $lastDivIdx + 6 # length of "</div>"
                    
                    $contentBefore = $normContent.Substring(0, $indexStart)
                    $contentAfter = $normContent.Substring($indexStart + $replaceLength)
                    
                    $finalContent = $contentBefore + $newText.Replace("`r`n", "`n").Replace("`n", "`r`n").Trim() + $contentAfter
                    [System.IO.File]::WriteAllText($appPath, $finalContent, [System.Text.Encoding]::UTF8)
                    Write-Host "App.tsx robust layout replacement succeeded!"
                } else {
                    Write-Error "Could not find layout grid closing tags."
                }
            } else {
                Write-Error "Could not find step === 'mode' boundary."
            }
        } else {
            Write-Error "Could not find layout grid container start tag."
        }
    }
} else {
    Write-Error "File not found: $appPath"
}
