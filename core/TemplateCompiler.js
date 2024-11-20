import { camel_to_dash } from "./Utils.js";
import { HtmlString } from "./HtmlString.js";
import { CloakedValue} from "./CloakedValue.js";
import { ClosureBuilder } from "./ClosureBuilder.js";
import { TemplateHelpers } from "./TemplateHelpers.js";
import { TemplateNode } from "./TemplateNode.js";
import { env } from "./Environment.js";
import { member } from "./Utils.js";

import "./EmbedSlot.js";
import "./ForEachBlock.js";
import "./IfBlock.js";

export function compileTemplateCode(rootTemplate, compilerOptions)
{
    // Every node in the template will get an id, starting at 1.
    let nodeId = 1;

    // Every dynamic property gets a variable named pNNN where n increments
    // using this variable
    let prevId = 1;

    // Any callbacks, arrays etc... referenced directly by the template
    // will be stored here and passed back to the compile code via refs
    let refs = [];

    let rootClosure = null;

    // Create root node info        
    let rootTemplateNode = new TemplateNode(rootTemplate, compilerOptions);

    // Storarge for export and bindings
    let exports = new Map();


    let closure = create_node_closure(rootTemplateNode, true);


    // Return the code and context
    return { 
        code: closure.toString(), 
        isSingleRoot: rootTemplateNode.isSingleRoot,
        refs,
    }

    // Emit a node closure (ie: node, child nodes, destroy, update
    // root nodes and exported api).
    function create_node_closure(ni, isRootTemplate)
    {
        // Dispatch table to handle compiling different node types
        let node_kind_handlers = {
            emit_text_node,
            emit_html_node,
            emit_dynamic_text_node,
            emit_comment_node,
            emit_fragment_node,
            emit_element_node,
            emit_integrated_node,
            emit_component_node,
        }

        // Setup closure functions
        let closure = new ClosureBuilder();
        let closure_create = closure.addFunction("create").code;
        let closure_post_create = [];
        let closure_bind = closure.addFunction("bind").code;
        let closure_update = closure.addFunction("update").code;
        let closure_unbind = closure.addFunction("unbind").code;
        let closure_setMounted = closure.addFunction("setMounted", ["mounted"]).code;
        let closure_destroy = closure.addFunction("destroy").code;
        let rebind;
        if (isRootTemplate)
            rebind = closure.addFunction("rebind").code;
        let bindings = new Map();

        // Create model variable
        if (isRootTemplate)
        {
            rootClosure = closure;
            rootClosure.code.append(`let model = context.model;`);
            rootClosure.code.append(`let document = env.document;`);
        }

        // Call create function
        closure.code.append(`create();`);
        closure.code.append(`bind();`);
        closure.code.append(`update();`);
            
        // Render code
        emit_node(ni);

        closure_create.append(closure_post_create);

        // Bind/unbind
        if (!closure_bind.closure.isEmpty)
        {
            closure_create.append(`bind();`);
            closure_destroy.closure.addProlog().append(`unbind();`);
        }

        let otherExports = []

        // Single root
        if (ni.isSingleRoot)
            otherExports.push(`  get rootNode() { return ${ni.spreadDomNodes()}; },`);

        // Root context?
        if (isRootTemplate)
        {
            otherExports.push(`  context,`);

            if (ni == rootTemplateNode)
            {
                exports.forEach((value, key) => 
                    otherExports.push(`  get ${key}() { return ${value}; },`));
            }

            if (closure.getFunction('bind').isEmpty)
            {
                rebind.append(`model = context.model`);
            }
            else
            {
                rebind.append(`if (model != context.model)`)
                rebind.braced(() => {
                    rebind.append(`unbind();`);
                    rebind.append(`model = context.model`);
                    rebind.append(`bind();`);
                });
            }
            otherExports.push(`  rebind,`);
        }
        else
        {
            otherExports.push(`  bind,`);
            otherExports.push(`  unbind,`);
        }


        // Render API to the closure
        closure.code.append([
            `return { `,
            `  update,`,
            `  destroy,`,
            `  setMounted,`,
            `  get rootNodes() { return [ ${ni.spreadDomNodes()} ]; },`,
            `  isSingleRoot: ${ni.isSingleRoot},`,
            ...otherExports,
            `};`]);

        return closure;

        function addNodeLocal(ni)
        {
            if (ni.template.export)
                rootClosure.addLocal(ni.name);
            else
                closure.addLocal(ni.name);
        }


        // Sometimes we need a temp variable.  This function
        // adds it when needed
        function need_update_temp()
        {
            if (!closure_update.temp_declared)
            {
                closure_update.temp_declared = true;
                closure_update.append(`let temp;`);
            }
        }

        // Recursively emit a node from a template
        function emit_node(ni)
        {
            // Assign it a name
            ni.name = `n${nodeId++}`;

            // Dispatch to kind handler
            node_kind_handlers[`emit_${ni.kind}_node`](ni);
        }

        // Emit a static 'text' node
        function emit_text_node(ni)
        {
            addNodeLocal(ni);
            closure_create.append(`${ni.name} = document.createTextNode(${JSON.stringify(ni.template)});`);
        }

        // Emit a static 'html' node
        function emit_html_node(ni)
        {
            if (ni.nodes.length == 0)
                return;

            // Emit
            addNodeLocal(ni);
            if (ni.nodes.length == 1)
            {
                closure_create.append(`${ni.name} = refs[${refs.length}].cloneNode(true);`);
                refs.push(ni.nodes[0]);
            }
            else
            {
                closure_create.append(`${ni.name} = refs[${refs.length}].map(x => x.cloneNode(true));`);
                refs.push(ni.nodes);
            }
        }

        // Emit a 'dynamic-text' onde
        function emit_dynamic_text_node(ni)
        {
            // Create
            addNodeLocal(ni);
            let prevName = `p${prevId++}`;
            closure.addLocal(prevName);
            closure_create.append(`${ni.name} = helpers.createTextNode("");`);

            // Update
            need_update_temp();
            closure_update.append(`temp = ${format_callback(refs.length)};`);
            closure_update.append(`if (temp !== ${prevName})`)
            closure_update.append(`  ${ni.name} = helpers.setNodeText(${ni.name}, ${prevName} = ${format_callback(refs.length)});`);

            // Store the callback as a ref
            refs.push(ni.template);
        }

        // Emit a 'comment' node
        function emit_comment_node(ni)
        {
            addNodeLocal(ni);
            if (ni.template.text instanceof Function)
            {
                // Dynamic comment

                // Create
                let prevName = `p${prevId++}`;
                closure.addLocal(prevName);
                closure_create.append(`${ni.name} = document.createComment("");`);

                // Update
                need_update_temp();
                closure_update.append(`temp = ${format_callback(refs.length)};`);
                closure_update.append(`if (temp !== ${prevName})`);
                closure_update.append(`  ${ni.name}.nodeValue = ${prevName} = temp;`);

                // Store callback
                refs.push(ni.template.text);
            }
            else
            {
                // Static
                closure_create.append(`${ni.name} = document.createComment(${JSON.stringify(ni.template.text)});`);
            }
        }

        // Emit an 'integrated' component node
        function emit_integrated_node(ni)
        {
            // Emit sub-nodes
            let nodeConstructors = [];
            let has_bindings = false;
            if (ni.integrated.nodes)
            {
                for (let i=0; i<ni.integrated.nodes.length; i++)
                {
                    // Create the sub-template node
                    let ni_sub = ni.integrated.nodes[i];
                    if (!ni_sub)
                    {
                        nodeConstructors.push(null);
                        continue;
                    }

                    ni_sub.name = `n${nodeId++}`;

                    // Emit it
                    let sub_closure = create_node_closure(ni_sub, false);

                    // Track if the closure has any bindings
                    let fnBind = sub_closure.getFunction("bind");
                    if (!fnBind.isEmpty)
                        has_bindings = true;

                    // Append to our closure
                    let nodeConstructor = `${ni_sub.name}_constructor_${i+1}`;
                    let itemClosureFn = closure.addFunction(nodeConstructor, [ ]);
                    sub_closure.appendTo(itemClosureFn.code);

                    nodeConstructors.push(nodeConstructor);
                }
            }

            closure_update.append(`${ni.name}.update()`);

            if (has_bindings)
            {
                closure_bind.append(`${ni.name}.bind()`);
                closure_unbind.append(`${ni.name}.unbind()`);
            }

            let data_index = -1;
            if (ni.integrated.data)
            {
                data_index = refs.length;
                refs.push(ni.integrated.data);
            }

            // Create integrated component
            addNodeLocal(ni);
            closure_create.append(
                `${ni.name} = new refs[${refs.length}]({`,
                `  context,`,
                `  data: ${ni.integrated.data ? `refs[${data_index}]` : `null`},`,
                `  nodes: [ ${nodeConstructors.join(", ")} ],`,
                `});`
            );
            refs.push(ni.template.type);

            // setMounted support
            closure_setMounted.append(`${ni.name}.setMounted(mounted);`);

            // destroy support
            closure_destroy.append(`${ni.name}?.destroy();`);
            closure_destroy.append(`${ni.name} = null;`);

            // Process common properties
            for (let key of Object.keys(ni.template))
            {
                // Process properties common to components and elements
                if (process_common_property(ni, key))
                    continue;

                throw new Error(`Unknown element template key: ${key}`);
            }
        
        }

        
        // Emit a 'component' node
        function emit_component_node(ni)
        {
            // Create component
            addNodeLocal(ni);
            closure_create.append(`${ni.name} = new refs[${refs.length}]();`);
            refs.push(ni.template.type);

            // If component has slots, create the object before attempting
            // to assign the content values
            let slotNames = new Set(ni.template.type.slots ?? []);
            if (slotNames.length > 0)
            {
                closure_create.append(`${ni.name}.create()`);
            }

            let auto_update = ni.template.update === "auto";
            let auto_modified_name = false;

            // setMounted support
            closure_setMounted.append(`${ni.name}.setMounted(mounted);`);
            
            // destroy support
            closure_destroy.append(`${ni.name}?.destroy();`);
            closure_destroy.append(`${ni.name} = null;`);

            // Process all keys
            for (let key of Object.keys(ni.template))
            {
                // Process properties common to components and elements
                if (process_common_property(ni, key))
                    continue;

                // Ignore for now
                if (key == "update")
                {
                    continue;
                }

                // Compile value as a template
                if (slotNames.has(key))
                {
                    if (ni.template[key] === undefined)
                        continue;

                    // Emit the template node
                    let propTemplate = new TemplateNode(ni.template[key], compilerOptions);
                    emit_node(propTemplate);
                    if (propTemplate.isSingleRoot)
                        closure_create.append(`${ni.name}${member(key)}.content = ${propTemplate.name};`);
                    else
                        closure_create.append(`${ni.name}${member(key)}.content = [${propTemplate.spreadDomNodes()}];`);
                    continue;
                }

                // All other properties, assign to the object
                let propType = typeof(ni.template[key]);
                if (propType == 'string' || propType == 'number' || propType == 'boolean')
                {
                    // Simple literal property
                    closure_create.append(`${ni.name}${member(key)} = ${JSON.stringify(ni.template[key])}`);
                }
                else if (propType === 'function')
                {
                    // Dynamic property

                    if (auto_update && !auto_modified_name)
                    {
                        auto_modified_name = `${ni.name}_mod`;
                        closure_update.append(`let ${auto_modified_name} = false;`);
                    }

                    // Create
                    let prevName = `p${prevId++}`;
                    closure.addLocal(prevName);
                    let callback_index = refs.length;

                    // Update
                    need_update_temp();
                    closure_update.append(`temp = ${format_callback(callback_index)};`);
                    closure_update.append(`if (temp !== ${prevName})`);
                    if (auto_update)
                    {
                        closure_update.append(`{`);
                        closure_update.append(`  ${auto_modified_name} = true;`);
                    }

                    closure_update.append(`  ${ni.name}${member(key)} = ${prevName} = temp;`);

                    if (auto_update)
                        closure_update.append(`}`);

                    // Store callback
                    refs.push(ni.template[key]);
                }
                else
                {
                    // Unwrap cloaked value
                    let val = ni.template[key];
                    if (val instanceof CloakedValue)
                        val = val.value;

                    // Object property
                    closure_create.append(`${ni.name}${member(key)} = refs[${refs.length}];`);
                    refs.push(val);
                }
            }

            // Generate deep update
            if (ni.template.update)
            {
                if (typeof(ni.template.update) === 'function')
                {
                    closure_update.append(`if (${format_callback(refs.length)})`);
                    closure_update.append(`  ${ni.name}.update();`);
                    refs.push(ni.template.update);
                }
                else
                {
                    if (auto_update)
                    {
                        if (auto_modified_name)
                        {
                            closure_update.append(`if (${auto_modified_name})`);
                            closure_update.append(`  ${ni.name}.update();`);
                        }
                    }
                    else
                    {
                        closure_update.append(`${ni.name}.update();`);
                    }
                }
            }
        }

        // Emit a 'fragment' noe
        function emit_fragment_node(ni)
        {
            emit_child_nodes(ni);
        }

        // Emit an 'element' node
        function emit_element_node(ni)
        {
            // Work out namespace
            let save_xmlns = closure.current_xmlns;
            let xmlns = ni.template.xmlns;
            if (xmlns === undefined && ni.template.type == 'svg')
            {
                xmlns = "http://www.w3.org/2000/svg";
            }
            if (xmlns == null)
                xmlns = closure.current_xmlns;

            // Create the element
            addNodeLocal(ni);
            if (!xmlns)
                closure_create.append(`${ni.name} = document.createElement(${JSON.stringify(ni.template.type)});`);
            else
            {
                closure.current_xmlns = xmlns;
                closure_create.append(`${ni.name} = document.createElementNS(${JSON.stringify(xmlns)}, ${JSON.stringify(ni.template.type)});`);
            }

            // destroy support
            closure_destroy.append(`${ni.name} = null;`);

            for (let key of Object.keys(ni.template))
            {
                // Process properties common to components and elements
                if (process_common_property(ni, key))
                    continue;

                if (key.startsWith("class_"))
                {
                    let className = camel_to_dash(key.substring(6));
                    let value = ni.template[key];

                    if (value instanceof Function)
                    {
                        if (!ni.bcCount)
                            ni.bcCount = 0;
                        let mgrName = `${ni.name}_bc${ni.bcCount++}`;
                        closure.addLocal(mgrName);
                        closure_create.append(`${mgrName} = helpers.boolClassMgr(context, ${ni.name}, ${JSON.stringify(className)}, refs[${refs.length}]);`);
                        refs.push(value);
                        closure_update.append(`${mgrName}();`);
                    }
                    else
                    {
                        closure_create.append(`helpers.setNodeClass(${ni.name}, ${JSON.stringify(className)}, ${value});`);
                    }
                    continue;
                }

                if (key.startsWith("style_"))
                {
                    let styleName = camel_to_dash(key.substring(6));
                    format_dynamic(ni.template[key], (valueExpr) => `helpers.setNodeStyle(${ni.name}, ${JSON.stringify(styleName)}, ${valueExpr})`);
                    continue;
                }

                if (key == "display")
                {
                    if (ni.template.display instanceof Function)
                    {
                        let mgrName = `${ni.name}_dm`;
                        closure.addLocal(mgrName);
                        closure_create.append(`${mgrName} = helpers.displayMgr(context, ${ni.name}, refs[${refs.length}]);`);
                        refs.push(ni.template.display);
                        closure_update.append(`${mgrName}();`);
                    }
                    else
                    {
                        closure_create.append(`helpers.setNodeDisplay(${ni.name}, ${JSON.stringify(ni.template.display)});`);
                    }
                    continue;
                }

                if (key == "text")
                {
                    if (ni.template.text instanceof Function)
                    {
                        format_dynamic(ni.template.text, (valueExpr) => `helpers.setElementText(${ni.name}, ${valueExpr})`);
                    }
                    else if (ni.template.text instanceof HtmlString)
                    {
                        closure_create.append(`${ni.name}.innerHTML = ${JSON.stringify(ni.template.text.html)};`);
                    }
                    if (typeof(ni.template.text) === 'string')
                    {
                        closure_create.append(`${ni.name}.innerText = ${JSON.stringify(ni.template.text)};`);
                    }
                    continue;
                }


                let attrName = key;
                if (key.startsWith("attr_"))
                    attrName = attrName.substring(5);

                if (!closure.current_xmlns)
                    attrName = camel_to_dash(attrName);

                format_dynamic(ni.template[key], (valueExpr) => `helpers.setElementAttribute(${ni.name}, ${JSON.stringify(attrName)}, ${valueExpr})`);
            }

            // Emit child nodes
            emit_child_nodes(ni);
            
            // Add all the child nodes to this node
            if (ni.childNodes?.length)
            {
                closure_create.append(`${ni.name}.append(${ni.spreadChildDomNodes()});`);
            }
            closure.current_xmlns = save_xmlns;
        }

        // Emit the child nodes of an element or fragment node
        function emit_child_nodes(ni)
        {
            // Child nodes?
            if (!ni.childNodes)
                return;

            // Create the child nodes
            for (let i=0; i<ni.childNodes.length; i++)
            {
                emit_node(ni.childNodes[i]);
            }
        }

        // Process properties common to html elements and components
        function process_common_property(ni, key)
        {
            if (is_known_property(key))
                return true;

            if (key == "export")
            {
                if (typeof(ni.template.export) !== 'string')
                    throw new Error("'export' must be a string");
                if (exports.has(ni.template.export))
                    throw new Error(`duplicate export name '${ni.template.export}'`);
                exports.set(ni.template.export, ni.name);
                return true;
            }

            if (key == "bind")
            {
                if (typeof(ni.template.bind) !== 'string')
                    throw new Error("'bind' must be a string");
                if (bindings.has(ni.template.export))
                    throw new Error(`duplicate bind name '${ni.template.bind}'`);

                // Remember binding
                bindings.set(ni.template.bind, true);

                // Generate it
                closure_bind.append(`model${member(ni.template.bind)} = ${ni.name};`);
                closure_unbind.append(`model${member(ni.template.bind)} = null;`);
                return true;
            }

            if (key.startsWith("on_"))
            {
                let eventName = key.substring(3);
                let handler = ni.template[key];
                if (typeof(handler) === 'string')
                {
                    let handlerName = handler;
                    handler = (c,...args) => c[handlerName](...args);
                }
                if (!(handler instanceof Function))
                    throw new Error(`event handler for '${key}' is not a function`);

                // create a variable name for the listener
                if (!ni.listenerCount)
                    ni.listenerCount = 0;
                ni.listenerCount++;
                let listener_name = `${ni.name}_ev${ni.listenerCount}`;
                closure.addLocal(listener_name);

                // Add listener
                closure_create.append(`${listener_name} = helpers.addEventListener(() => model, ${ni.name}, ${JSON.stringify(eventName)}, refs[${refs.length}]);`);
                refs.push(handler);

                closure_destroy.append(`${listener_name}?.();`);
                closure_destroy.append(`${listener_name} = null;`);

                return true;
            }

            if (key == "input")
            {
                let inputName = `${ni.name}_in`;
                closure.addLocal(inputName);
                closure_create.append(`${inputName} = helpers.input(refs[${refs.length}])`);
                closure_post_create.push(`${inputName}.create(${ni.name}, context);`);
                refs.push(ni.template[key]);
                closure_update.append(`${inputName}.update()`);
                closure_destroy.append(`${inputName}.destroy()`);
                return true;
            }

            if (key == "debug_create")
            {
                if (typeof(ni.template[key]) === 'function')
                {
                    closure_create.append(`if (${format_callback(refs.length)})`);
                    closure_create.append(`  debugger;`);
                    refs.push(ni.template[key]);
                }
                else if (ni.template[key])
                    closure_create.append("debugger;");
                return true;
            }
            if (key == "debug_update")
            {
                if (typeof(ni.template[key]) === 'function')
                {
                    closure_update.append(`if (${format_callback(refs.length)})`);
                    closure_update.append(`  debugger;`);
                    refs.push(ni.template[key]);
                }
                else if (ni.template[key])
                    closure_update.append("debugger;");
                return true;
            }
            if (key == "debug_render")
                return true;


            return false;
        }

        function is_known_property(key)
        {
            return key == "type" || key == "childNodes" || key == "xmlns";
        }

        function format_callback(index)
        {
            return `refs[${index}].call(model, model, context)`
        }

        // Helper to format a dynamic value on a node (ie: a callback)
        function format_dynamic(value, formatter)
        {
            if (value instanceof Function)
            {
                let prevName = `p${prevId++}`;
                closure.addLocal(prevName);
                
                // Render the update code
                let code = formatter();

                need_update_temp();
                closure_update.append(`temp = ${format_callback(refs.length)};`);
                closure_update.append(`if (temp !== ${prevName})`);
                closure_update.append(`  ${formatter(prevName + " = temp")};`);

                // Store the callback in the context callback array
                refs.push(value);
            }
            else
            {
                // Static value, just output it directly
                closure_create.append(formatter(JSON.stringify(value)));
            }
        }
    }
}


let _nextInstanceId = 1;

export function compileTemplate(rootTemplate, compilerOptions)
{
    compilerOptions = compilerOptions ?? {};
    compilerOptions.compileTemplate = compileTemplate;

    // Compile code
    let code = compileTemplateCode(rootTemplate, compilerOptions);
    //console.log(code.code);

    // Put it in a function
    let templateFunction = new Function("env", "refs", "helpers", "context", code.code);

    // Wrap it in a constructor function
    let compiledTemplate = function(context)
    {
        if (!context)
            context = {};
        context.$instanceId = _nextInstanceId++;
        return templateFunction(env, code.refs, TemplateHelpers, context ?? {});
    }

    // Store meta data about the component on the function since we need this before 
    // construction
    compiledTemplate.isSingleRoot = code.isSingleRoot;

    return compiledTemplate;
}

