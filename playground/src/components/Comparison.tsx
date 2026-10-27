import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function Comparison() {
  return <section className="comparison-section" aria-labelledby="comparison-title">
    <div className="section-heading"><h2 id="comparison-title">Read the source. Compare the behavior.</h2><span>Generated shadcn/ui · Radix primitives</span></div>
    <div className="comparison-grid">
      <article className="pattern-card"><p className="eyebrow">SHADCN DIALOG</p><h3>A composed focus layer.</h3><p>Compare its lifecycle, portal, and composable trigger with the custom native dialog above.</p>
        <Dialog><DialogTrigger asChild><button className="primary">Open shadcn dialog <span aria-hidden="true">↗</span></button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>A shadcn dialog</DialogTitle><DialogDescription>Radix manages the focus scope and dismissal behavior behind these generated wrappers.</DialogDescription></DialogHeader><label htmlFor="shadcn-practice">Comparison name</label><input id="shadcn-practice" className="comparison-input" placeholder="Try the same keyboard sequence"/><DialogClose asChild><button className="primary">Close comparison</button></DialogClose></DialogContent></Dialog>
      </article>
      <article className="pattern-card"><p className="eyebrow">SHADCN TABS</p><h3>More than one direction.</h3><p>This second example uses vertical orientation, manual activation, and a disabled tab—cases outside the custom horizontal demo.</p>
        <Tabs defaultValue="first" orientation="vertical" activationMode="manual" className="comparison-tabs">
          <TabsList aria-label="shadcn comparison topics"><TabsTrigger value="first">First</TabsTrigger><TabsTrigger value="disabled" disabled>Unavailable</TabsTrigger><TabsTrigger value="last">Last</TabsTrigger></TabsList>
          <TabsContent value="first"><h4>A deliberate choice.</h4><p>Use Up/Down to move focus. Press Enter or Space to activate. The disabled tab is skipped.</p></TabsContent>
          <TabsContent value="last"><h4>Selection follows your intent.</h4><p>Manual activation leaves the previous panel visible until you commit the focused tab.</p></TabsContent>
        </Tabs>
      </article>
    </div>
  </section>;
}
